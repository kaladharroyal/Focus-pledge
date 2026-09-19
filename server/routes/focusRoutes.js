const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');
const {
  awardSlotCompletion,
  applyDistractionPenalty,
  awardDailyCompletionBonus,
  getMultiplierForStreak
} = require('../services/gamificationService');

// Protect all focus routes with auth middleware
router.use(auth);

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// POST /api/focus/start - Begin focus session on a slot
router.post('/start', async (req, res) => {
  try {
    const { slotId } = req.body;
    const user = req.user;
    const today = getTodayString();
    const schedule = await Schedule.findOne({ userId: req.userId, date: today });

    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    const slot = schedule.slots.id(slotId);
    if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });

    // Mark other in_progress slots back to pending or paused
    schedule.slots.forEach(s => {
      if (s._id.toString() !== slotId && s.status === 'in_progress') {
        s.status = 'pending';
      }
    });

    slot.status = 'in_progress';
    await schedule.save();

    res.json({
      success: true,
      slot,
      multiplier: getMultiplierForStreak(user.currentStreak),
      schedule
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/focus/complete - Complete focus session, calculate exact credits & day bonus
router.post('/complete', async (req, res) => {
  try {
    const { slotId } = req.body;
    const user = req.user;
    const today = getTodayString();
    const schedule = await Schedule.findOne({ userId: req.userId, date: today });

    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    const slot = schedule.slots.id(slotId);
    if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });

    if (slot.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Slot is already completed' });
    }

    slot.status = 'completed';
    slot.completedAt = new Date();

    // Award slot completion credits (10 base * multiplier)
    const { creditsEarned, multiplier, newTotal, log } = await awardSlotCompletion(user, slot.title);
    slot.creditsEarned = creditsEarned;

    // Check if ALL slots for today are now completed to award Full-Day Completion Bonus (+20)
    let fullDayBonusAwarded = false;
    const nonBreakSlots = schedule.slots.filter(s => s.category !== 'break');
    const allCompleted = nonBreakSlots.length > 0 && nonBreakSlots.every(s => s.status === 'completed');

    if (allCompleted && !schedule.isBonusAwarded) {
      schedule.isBonusAwarded = true;
      await awardDailyCompletionBonus(user);
      fullDayBonusAwarded = true;
    }

    schedule.totalCreditsEarnedToday = (schedule.totalCreditsEarnedToday || 0) + creditsEarned;
    await schedule.save();

    const userJson = user.toObject();
    delete userJson.password;

    res.json({
      success: true,
      message: `🎉 Focus session complete! Earned ${creditsEarned} credits (${multiplier}x multiplier)`,
      creditsEarned,
      multiplier,
      newTotalCredits: user.totalCredits,
      level: user.level,
      fullDayBonusAwarded,
      slot,
      schedule,
      user: userJson
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/focus/penalty - Distraction attempt logged during active slot (-5 credits)
router.post('/penalty', async (req, res) => {
  try {
    const { slotId, distractionName } = req.body;
    const user = req.user;
    const today = getTodayString();
    const schedule = await Schedule.findOne({ userId: req.userId, date: today });

    let slot = null;
    if (schedule && slotId) {
      slot = schedule.slots.id(slotId);
      if (slot) {
        slot.distractionsAttempted = (slot.distractionsAttempted || 0) + 1;
        slot.penaltyDeductions = (slot.penaltyDeductions || 0) + 5;
        await schedule.save();
      }
    }

    const { penaltyDeducted, newTotal, log } = await applyDistractionPenalty(user, slot ? slot.title : 'Focus Session');

    const userJson = user.toObject();
    delete userJson.password;

    res.json({
      success: true,
      message: `⚠️ Distraction detected (${distractionName || 'Blocked App'}). -5 credits penalty applied!`,
      penaltyDeducted,
      newTotalCredits: newTotal,
      distractionsBlockedCount: user.distractionsBlockedCount,
      slot,
      user: userJson
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/focus/abandon - Mark slot as failed or skipped
router.post('/abandon', async (req, res) => {
  try {
    const { slotId } = req.body;
    const today = getTodayString();
    const schedule = await Schedule.findOne({ userId: req.userId, date: today });

    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    const slot = schedule.slots.id(slotId);
    if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });

    slot.status = 'failed';
    await schedule.save();

    res.json({ success: true, slot, schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
