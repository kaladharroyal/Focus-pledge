const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  consistencyStreakDays: {
    type: Number,
    required: true
  },
  totalCredits: {
    type: Number,
    required: true
  },
  levelEarned: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold'],
    required: true
  },
  consistencyScore: {
    type: Number,
    default: 98
  },
  title: {
    type: String,
    default: 'Time Management Consistency Certificate'
  },
  issuer: {
    type: String,
    default: 'FocusPledge Academic & Productivity Board'
  },
  verificationHash: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', CertificateSchema);
