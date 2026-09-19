const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const auth = require('../middleware/auth');

// GET /api/certificate/status - Check certificate eligibility for logged-in user
router.get('/status', auth, async (req, res) => {
  try {
    const user = req.user;

    const isSilverOrAbove = user.level === 'Silver' || user.level === 'Gold' || user.totalCredits >= 500;
    const is21DayStreak = user.currentStreak >= 21 || user.highestStreak >= 21;
    const isEligible = isSilverOrAbove || is21DayStreak;

    // Check if an existing certificate is issued for this specific user
    const existingCert = await Certificate.findOne({ userId: req.userId }).sort({ createdAt: -1 });

    const userJson = user.toObject();
    delete userJson.password;

    res.json({
      success: true,
      isEligible,
      criteria: {
        silverLevelMet: isSilverOrAbove,
        streakMet: is21DayStreak,
        currentCredits: user.totalCredits,
        creditsNeededForSilver: Math.max(0, 500 - user.totalCredits),
        currentStreak: user.currentStreak,
        streakDaysNeeded: Math.max(0, 21 - user.currentStreak)
      },
      certificate: existingCert,
      user: userJson
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/certificate/issue - Generate/issue official certificate for logged-in user
router.post('/issue', auth, async (req, res) => {
  try {
    const user = req.user;

    const isSilverOrAbove = user.level === 'Silver' || user.level === 'Gold' || user.totalCredits >= 500;
    const is21DayStreak = user.currentStreak >= 21 || user.highestStreak >= 21;

    if (!isSilverOrAbove && !is21DayStreak) {
      return res.status(403).json({
        success: false,
        error: 'Certificate locked. You need Silver Level (500+ credits) or a 21-Day Streak to unlock.'
      });
    }

    const { recipientName } = req.body;
    const finalName = (recipientName && recipientName.trim()) || user.name || 'Pledge Scholar';

    // Unique Certificate Serial Number e.g. FP-2026-9A82F1
    const certCode = 'FP-' + new Date().getFullYear() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const verificationHash = crypto.createHash('sha256').update(certCode + finalName + user._id).digest('hex');

    const certificate = await Certificate.create({
      certificateId: certCode,
      userId: req.userId,
      recipientName: finalName,
      issueDate: new Date(),
      consistencyStreakDays: user.highestStreak || user.currentStreak || 21,
      totalCredits: user.totalCredits,
      levelEarned: user.level,
      consistencyScore: 98.6,
      verificationHash
    });

    res.json({
      success: true,
      message: '🎉 Congratulations! Your Time Management Consistency Certificate has been issued.',
      certificate
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/certificate/verify/:certId - Public verification (No auth required)
router.get('/verify/:certId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certId.toUpperCase() });
    if (!cert) {
      return res.status(404).json({ success: false, error: 'Certificate record not found or invalid serial number.' });
    }
    res.json({
      success: true,
      verified: true,
      certificate: cert
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
