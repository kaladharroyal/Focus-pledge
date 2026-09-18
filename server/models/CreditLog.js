const mongoose = require('mongoose');

const CreditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['slot_completion', 'daily_bonus', 'penalty_distraction', 'streak_reward', 'manual_adjustment'],
    required: true
  },
  multiplier: {
    type: Number,
    default: 1.0
  },
  slotTitle: {
    type: String,
    default: null
  },
  resultingTotal: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CreditLog', CreditLogSchema);
