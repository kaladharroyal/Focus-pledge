const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { calculateTier, checkAndAwardBadges } = require('../services/gamificationService');

// Protect all user routes with auth middleware
router.use(auth);

// GET /api/user - Get logged-in user details
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/user/checkin - "I'm Home" Action
router.post('/checkin', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];

    let streakIncreased = false;
    let message = "Welcome home! Today's focus pledge initiated.";

    if (user.lastCheckInDate) {
      const lastDate = new Date(user.lastCheckInDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (user.lastCheckInDate === today) {
        message = "You're already checked in for today! Keep up the great work.";
      } else if (diffDays === 1) {
        user.currentStreak += 1;
        if (user.currentStreak > (user.highestStreak || 1)) {
          user.highestStreak = user.currentStreak;
        }
        streakIncreased = true;
        message = `🔥 Streak continued! You're now on Day ${user.currentStreak}!`;
      } else {
        // Streak reset if missed > 1 day
        user.currentStreak = 1;
        message = "Fresh start! Day 1 streak activated.";
      }
    } else {
      user.currentStreak = 1;
      user.highestStreak = 1;
      streakIncreased = true;
      message = "Welcome to FocusPledge! Day 1 streak activated.";
    }

    user.lastCheckInDate = today;
    checkAndAwardBadges(user);
    await user.save();

    const userJson = user.toObject();
    delete userJson.password;

    res.json({
      success: true,
      message,
      streakIncreased,
      currentStreak: user.currentStreak,
      user: userJson
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/user/profile
router.put('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const { name, settings } = req.body;

    if (name) user.name = name.trim();
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();
    const userJson = user.toObject();
    delete userJson.password;

    res.json({ success: true, user: userJson });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/user/simulate-streak - Developer / demo helper
router.post('/simulate-streak', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const { targetStreak, targetCredits } = req.body;

    if (targetStreak !== undefined) {
      user.currentStreak = Number(targetStreak);
      if (user.currentStreak > user.highestStreak) {
        user.highestStreak = user.currentStreak;
      }
    }
    if (targetCredits !== undefined) {
      user.totalCredits = Number(targetCredits);
      user.level = calculateTier(user.totalCredits);
    }

    checkAndAwardBadges(user);
    await user.save();

    const userJson = user.toObject();
    delete userJson.password;

    res.json({
      success: true,
      user: userJson,
      message: `Simulated to Streak ${user.currentStreak}, Credits ${user.totalCredits} (${user.level})`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
