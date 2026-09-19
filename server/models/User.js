const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: true
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

// Pre-save hook to hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Helper method to compute level from credits
UserSchema.methods.calculateLevel = function () {
  this.level = this.totalCredits >= 2000 ? 'Gold' : this.totalCredits >= 500 ? 'Silver' : 'Bronze';
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

