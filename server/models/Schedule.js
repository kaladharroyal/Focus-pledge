const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['study', 'homework', 'project', 'reading', 'break', 'creative', 'routine', 'other'],
    default: 'study'
  },
  startTime: {
    type: String,
    required: true // Format "HH:mm" e.g., "17:00"
  },
  endTime: {
    type: String,
    required: true // Format "HH:mm" e.g., "18:30"
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'skipped'],
    default: 'pending'
  },
  creditsEarned: {
    type: Number,
    default: 0
  },
  penaltyDeductions: {
    type: Number,
    default: 0
  },
  distractionsAttempted: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: null
  }
});

const ScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true // YYYY-MM-DD
  },
  checkedInAt: {
    type: Date,
    default: Date.now
  },
  slots: [SlotSchema],
  isBonusAwarded: {
    type: Boolean,
    default: false
  },
  totalCreditsEarnedToday: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
