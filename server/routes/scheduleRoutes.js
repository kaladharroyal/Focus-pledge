const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const User = require('../models/User');

// Helper to get today's date string YYYY-MM-DD
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// GET /api/schedules/today
router.get('/today', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const today = getTodayString();
    let schedule = await Schedule.findOne({ userId: user._id, date: today });

    if (!schedule) {
      // Provide an inspiring default evening schedule template if none exists
      schedule = await Schedule.create({
        userId: user._id,
        date: today,
        slots: [
          {
            title: 'Physics Chapter 4 Problems',
            category: 'study',
            startTime: '17:00',
            endTime: '18:15',
            durationMinutes: 75,
            status: 'pending'
          },
          {
            title: 'Evening Refresh & Tea Break',
            category: 'break',
            startTime: '18:15',
            endTime: '18:45',
            durationMinutes: 30,
            status: 'pending'
          },
          {
            title: 'Calculus Assignment & Coding',
            category: 'homework',
            startTime: '18:45',
            endTime: '20:00',
            durationMinutes: 75,
            status: 'pending'
          },
          {
            title: 'Digital Illustration / Sketching',
            category: 'creative',
            startTime: '20:30',
            endTime: '21:30',
            durationMinutes: 60,
            status: 'pending'
          }
        ]
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
    const user = await User.findOne();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const today = getTodayString();
    let schedule = await Schedule.findOne({ userId: user._id, date: today });

    if (!schedule) {
      schedule = new Schedule({ userId: user._id, date: today, slots: [] });
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
    const user = await User.findOne();
    const today = getTodayString();
    const schedule = await Schedule.findOne({ userId: user._id, date: today });

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
    const user = await User.findOne();
    const today = getTodayString();
    const schedule = await Schedule.findOne({ userId: user._id, date: today });

    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    schedule.slots.pull(req.params.slotId);
    await schedule.save();

    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
