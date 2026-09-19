const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');

// Protect all schedule routes with auth middleware
router.use(auth);

// Helper to get today's date string YYYY-MM-DD
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// GET /api/schedules/today
router.get('/today', async (req, res) => {
  try {
    const today = getTodayString();
    let schedule = await Schedule.findOne({ userId: req.userId, date: today });

    if (!schedule) {
      schedule = await Schedule.create({
        userId: req.userId,
        date: today,
        slots: []
      });
    }

    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schedules/slots - Add slot to today's schedule
router.post('/slots', async (req, res) => {
  try {
    const today = getTodayString();
    let schedule = await Schedule.findOne({ userId: req.userId, date: today });

    if (!schedule) {
      schedule = new Schedule({ userId: req.userId, date: today, slots: [] });
    }

    const { title, category, startTime, endTime, durationMinutes } = req.body;
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ success: false, error: 'Title, start time, and end time are required.' });
    }

    schedule.slots.push({
      title,
      category: category || 'study',
      startTime,
      endTime,
      durationMinutes: durationMinutes || 45,
      status: 'pending'
    });

    await schedule.save();
    res.json({ success: true, schedule, newSlot: schedule.slots[schedule.slots.length - 1] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/schedules/slots/:slotId - Update slot
router.put('/slots/:slotId', async (req, res) => {
  try {
    const today = getTodayString();
    const schedule = await Schedule.findOne({ userId: req.userId, date: today });

    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    const slot = schedule.slots.id(req.params.slotId);
    if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });

    const { title, category, startTime, endTime, durationMinutes, status } = req.body;
    if (title) slot.title = title;
    if (category) slot.category = category;
    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;
    if (durationMinutes) slot.durationMinutes = durationMinutes;
    if (status) slot.status = status;

    await schedule.save();
    res.json({ success: true, schedule, updatedSlot: slot });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/schedules/slots/:slotId
router.delete('/slots/:slotId', async (req, res) => {
  try {
    const today = getTodayString();
    const schedule = await Schedule.findOne({ userId: req.userId, date: today });

    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    schedule.slots.pull(req.params.slotId);
    await schedule.save();

    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
