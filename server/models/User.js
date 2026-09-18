const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Alex Rivera'
  },
  email: {
    type: String,
    default: 'focus.student@pledge.io'
  },
  totalCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  currentStreak: {
    type: Number,
    default: 1
  },
  highestStreak: {
    type: Number,
    default: 1
  },
  lastCheckInDate: {
    type: String,
    default: null
  },
  level: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold'],
    default: 'Bronze'
  },
  completedSlotsCount: {
    type: Number,
    default: 0
  },
  distractionsBlockedCount: {
    type: Number,
    default: 0
  },
  unlockedBadges: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    blockedApps: {
      type: [String],
      default: ['Instagram', 'YouTube', 'TikTok', 'Reddit', 'Netflix', 'Twitter (X)', 'Discord', 'Mobile Games']
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    lofiAudio: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Helper method to compute level from credits
UserSchema.methods.calculateLevel = function () {
  if (this.totalCredits >= 2000) {
    this.level = 'Gold';
  } else if (this.totalCredits >= 500) {
    this.level = 'Silver';
  } else {
    this.level = 'Bronze';
  }
  return this.level;
};

// Helper method to get current streak multiplier
UserSchema.methods.getStreakMultiplier = function () {
  const s = this.currentStreak || 1;
  if (s >= 30) return 2.0;
  if (s >= 7) return 1.5;
  if (s >= 3) return 1.2;
  return 1.0;
};

module.exports = mongoose.model('User', UserSchema);
