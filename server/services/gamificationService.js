const User = require('../models/User');
const CreditLog = require('../models/CreditLog');

const BADGES_CATALOG = [
  { id: 'first_pledge', name: 'First Pledge', description: 'Completed your first focus session without distraction.', icon: '🌱' },
  { id: 'streak_3', name: 'Ignition (1.2x)', description: 'Maintained a 3-day streak! Multiplier upgraded to 1.2x.', icon: '⚡' },
  { id: 'streak_7', name: 'Focus Warrior (1.5x)', description: 'Maintained a 7-day streak! Multiplier upgraded to 1.5x.', icon: '🔥' },
  { id: 'streak_21', name: 'Habit Master (21 Days)', description: 'Hit the 21-day neuroplasticity milestone! Certificate Unlocked.', icon: '🎓' },
  { id: 'streak_30', name: 'Zen Master (2.0x)', description: 'Maintained a 30-day streak! Double credits active.', icon: '👑' },
  { id: 'silver_club', name: 'Silver Achiever', description: 'Crossed 500 total credits. Certificate generation unlocked!', icon: '🥈' },
  { id: 'gold_legend', name: 'Gold Legend', description: 'Crossed 2,000 total credits. Elite productivity master.', icon: '🥇' },
  { id: 'perfect_day', name: 'Flawless Day', description: 'Completed all planned slots in a day with 0 distractions.', icon: '✨' },
  { id: 'guardian', name: 'Shield of Willpower', description: 'Successfully resisted 5+ distraction attempts.', icon: '🛡️' }
];

function getMultiplierForStreak(streak) {
  if (streak >= 30) return 2.0;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
}

function calculateTier(credits) {
  if (credits >= 2000) return 'Gold';
  if (credits >= 500) return 'Silver';
  return 'Bronze';
}

async function awardSlotCompletion(user, slotTitle) {
  const multiplier = getMultiplierForStreak(user.currentStreak);
  const baseCredit = 10;
  const creditsEarned = Math.round(baseCredit * multiplier);

  user.totalCredits += creditsEarned;
  user.completedSlotsCount = (user.completedSlotsCount || 0) + 1;
  user.level = calculateTier(user.totalCredits);

  // Check badges
  checkAndAwardBadges(user);

  await user.save();

  // Log transaction
  const log = await CreditLog.create({
    userId: user._id,
    amount: creditsEarned,
    reason: `Completed focus session: ${slotTitle || 'Scheduled Slot'}`,
    type: 'slot_completion',
    multiplier,
    slotTitle,
    resultingTotal: user.totalCredits
  });

  return { creditsEarned, multiplier, newTotal: user.totalCredits, user, log };
}

async function applyDistractionPenalty(user, slotTitle) {
  const penalty = 5;
  const previous = user.totalCredits;
  user.totalCredits = Math.max(0, user.totalCredits - penalty);
  user.distractionsBlockedCount = (user.distractionsBlockedCount || 0) + 1;
  user.level = calculateTier(user.totalCredits);

  checkAndAwardBadges(user);
  await user.save();

  const log = await CreditLog.create({
    userId: user._id,
    amount: -penalty,
    reason: `Distraction penalty during ${slotTitle || 'active session'}`,
    type: 'penalty_distraction',
    multiplier: 1.0,
    slotTitle,
    resultingTotal: user.totalCredits
  });

  return { penaltyDeducted: penalty, newTotal: user.totalCredits, user, log };
}

async function awardDailyCompletionBonus(user) {
  const bonus = 20;
  user.totalCredits += bonus;
  user.level = calculateTier(user.totalCredits);

  checkAndAwardBadges(user);
  await user.save();

  const log = await CreditLog.create({
    userId: user._id,
    amount: bonus,
    reason: 'Full-day schedule completion bonus (+20)',
    type: 'daily_bonus',
    multiplier: 1.0,
    resultingTotal: user.totalCredits
  });

  return { bonus, newTotal: user.totalCredits, user, log };
}

function checkAndAwardBadges(user) {
  const currentBadgeIds = new Set((user.unlockedBadges || []).map(b => b.id));
  const newBadges = [];

  const maybeAward = (badgeId) => {
    if (!currentBadgeIds.has(badgeId)) {
      const b = BADGES_CATALOG.find(x => x.id === badgeId);
      if (b) {
        user.unlockedBadges.push({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          unlockedAt: new Date()
        });
        newBadges.push(b);
        currentBadgeIds.add(badgeId);
      }
    }
  };

  if (user.completedSlotsCount >= 1) maybeAward('first_pledge');
  if (user.currentStreak >= 3) maybeAward('streak_3');
  if (user.currentStreak >= 7) maybeAward('streak_7');
  if (user.currentStreak >= 21) maybeAward('streak_21');
  if (user.currentStreak >= 30) maybeAward('streak_30');
  if (user.totalCredits >= 500) maybeAward('silver_club');
  if (user.totalCredits >= 2000) maybeAward('gold_legend');
  if (user.distractionsBlockedCount >= 5) maybeAward('guardian');

  return newBadges;
}

module.exports = {
  BADGES_CATALOG,
  getMultiplierForStreak,
  calculateTier,
  awardSlotCompletion,
  applyDistractionPenalty,
  awardDailyCompletionBonus,
  checkAndAwardBadges
};
