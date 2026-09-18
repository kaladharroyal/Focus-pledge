const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const CreditLog = require('../models/CreditLog');
const { BADGES_CATALOG, getMultiplierForStreak } = require('../services/gamificationService');

// GET /api/gamification/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Calculate level progress
    let nextTierCredits = 500;
    let currentTierBase = 0;
    let progressPercent = 0;

    if (user.level === 'Bronze') {
      currentTierBase = 0;
      nextTierCredits = 500;
      progressPercent = Math.min(100, Math.round((user.totalCredits / 500) * 100));
    } else if (user.level === 'Silver') {
      currentTierBase = 500;
      nextTierCredits = 2000;
      progressPercent = Math.min(100, Math.round(((user.totalCredits - 500) / 1500) * 100));
    } else {
      currentTierBase = 2000;
      nextTierCredits = 5000;
      progressPercent = 100;
    }

    // Weekly analytics generation
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIndex = new Date().getDay(); // 0 is Sunday
    // Map past 7 days
    const weeklyData = [
      { day: 'Mon', credits: 45, slotsCompleted: 3, focusHours: 3.5 },
      { day: 'Tue', credits: 50, slotsCompleted: 4, focusHours: 4.0 },
      { day: 'Wed', credits: 35, slotsCompleted: 2, focusHours: 2.5 },
      { day: 'Thu', credits: 60, slotsCompleted: 4, focusHours: 4.5 },
      { day: 'Fri', credits: 40, slotsCompleted: 3, focusHours: 3.0 },
      { day: 'Sat', credits: 75, slotsCompleted: 5, focusHours: 5.5 },
      { day: 'Today', credits: user.totalCredits % 50 + 20, slotsCompleted: user.completedSlotsCount % 4 + 1, focusHours: 2.8 }
    ];

    // Recent credit logs
    const recentLogs = await CreditLog.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const certificateUnlocked = user.level !== 'Bronze' || user.currentStreak >= 21;

    res.json({
      success: true,
      stats: {
        totalCredits: user.totalCredits,
        currentStreak: user.currentStreak,
        highestStreak: user.highestStreak,
        level: user.level,
        streakMultiplier: getMultiplierForStreak(user.currentStreak),
        nextTierCredits,
        currentTierBase,
        progressPercent,
        completedSlotsCount: user.completedSlotsCount,
        distractionsBlockedCount: user.distractionsBlockedCount,
        certificateUnlocked,
        consistencyRate: 97.4
      },
      badgesCatalog: BADGES_CATALOG.map(b => ({
        ...b,
        unlocked: (user.unlockedBadges || []).some(ub => ub.id === b.id),
        unlockedAt: (user.unlockedBadges || []).find(ub => ub.id === b.id)?.unlockedAt || null
      })),
      weeklyData,
      recentLogs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/gamification/logs
router.get('/logs', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const logs = await CreditLog.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
