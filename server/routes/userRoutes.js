const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { calculateTier, checkAndAwardBadges } = require('../services/gamificationService');

// Helper to get or create demo user
async function getOrCreateDefaultUser() {
  let user = await User.findOne();
  if (!user) {
    user = await User.create({
      name: 'Alex Rivera',
      email: 'alex.rivera@focuspledge.io',
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
  }
  return user;
}

// GET /api/user
router.get('/', async (req, res) => {
  try {
    const user = await getOrCreateDefaultUser();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/user/checkin - "I'm Home" Action
router.post('/checkin', async (req, res) => {
  try {
    const user = await getOrCreateDefaultUser();
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

    res.json({
      success: true,
      message,
      streakIncreased,
      currentStreak: user.currentStreak,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/user/profile
router.put('/profile', async (req, res) => {
  try {
    const user = await getOrCreateDefaultUser();
    const { name, settings } = req.body;

    if (name) user.name = name;
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/user/simulate-streak - Quick developer / demo helper
router.post('/simulate-streak', async (req, res) => {
  try {
    const user = await getOrCreateDefaultUser();
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

    res.json({ success: true, user, message: `Simulated to Streak ${user.currentStreak}, Credits ${user.totalCredits} (${user.level})` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
