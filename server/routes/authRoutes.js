const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'focuspledge_jwt_secure_secret_key_2026';

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
}

// Helper to seed initial starter schedule for a new user
async function seedStarterSchedule(userId) {
  const today = new Date().toISOString().split('T')[0];
  const existing = await Schedule.findOne({ userId, date: today });
  if (!existing) {
    await Schedule.create({
      userId,
      date: today,
      slots: [
        {
          title: 'Deep Focus & Priority Tasks',
          category: 'study',
          startTime: '17:00',
          endTime: '18:15',
          durationMinutes: 75,
          status: 'pending'
        },
        {
          title: 'Mindful Break & Hydration',
          category: 'break',
          startTime: '18:15',
          endTime: '18:45',
          durationMinutes: 30,
          status: 'pending'
        },
        {
          title: 'Core Assignments & Practice',
          category: 'homework',
          startTime: '18:45',
          endTime: '20:00',
          durationMinutes: 75,
          status: 'pending'
        },
        {
          title: 'Skill Development & Creative Review',
          category: 'creative',
          startTime: '20:30',
          endTime: '21:30',
          durationMinutes: 60,
          status: 'pending'
        }
      ]
    });
  }
}

// POST /api/auth/register - Register new account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please log in instead.'
      });
    }

    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      totalCredits: 0,
      currentStreak: 1,
      highestStreak: 1,
      level: 'Bronze',
      completedSlotsCount: 0,
      distractionsBlockedCount: 0,
      unlockedBadges: [
        {
          id: 'first_pledge',
          name: 'First Pledge',
          description: 'Completed your first focus session without distraction.',
          icon: '🌱',
          unlockedAt: new Date()
        }
      ]
    });

    await user.save();
    await seedStarterSchedule(user._id);

    const token = generateToken(user._id);
    const userJson = user.toObject();
    delete userJson.password;

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: userJson
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: err.message || 'Error creating account.' });
  }
});

// POST /api/auth/login - Log in existing user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both email and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id);
    const userJson = user.toObject();
    delete userJson.password;

    // Ensure they have today's schedule initialized
    await seedStarterSchedule(user._id);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: userJson
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message || 'Error logging in.' });
  }
});

// POST /api/auth/demo - Quick 1-click Demo Account Login
router.post('/demo', async (req, res) => {
  try {
    const demoEmail = 'alex.rivera@focuspledge.io';
    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = new User({
        name: 'Alex Rivera',
        email: demoEmail,
        password: 'demoPassword123',
        totalCredits: 320,
        currentStreak: 5,
        highestStreak: 5,
        level: 'Bronze',
        completedSlotsCount: 18,
        distractionsBlockedCount: 3,
        unlockedBadges: [
          { id: 'first_pledge', name: 'First Pledge', description: 'Completed your first focus session without distraction.', icon: '🌱', unlockedAt: new Date() },
          { id: 'streak_3', name: 'Ignition (1.2x)', description: 'Maintained a 3-day streak! Multiplier upgraded to 1.2x.', icon: '⚡', unlockedAt: new Date() }
        ]
      });
      await user.save();
    }

    await seedStarterSchedule(user._id);
    const token = generateToken(user._id);
    const userJson = user.toObject();
    delete userJson.password;

    res.json({
      success: true,
      message: 'Logged in as Demo User!',
      token,
      user: userJson
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me - Get current logged-in user profile
router.get('/me', auth, async (req, res) => {
  try {
    const userJson = req.user.toObject();
    delete userJson.password;
    res.json({
      success: true,
      user: userJson
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
