// Shared mining configuration and reward logic for Bitgold (BTG)

export const MINING_CONFIG = {
  TOTAL_SUPPLY: 21_000_000,
  BASE_REWARD: 0.5,
  STREAK_BONUS_PER_DAY: 0.01,
  MAX_STREAK_BONUS_DAYS: 30,
  REFERRAL_BONUS_PER_REFERRAL: 0.02,
  L1_RATE: 0.10,
  L2_RATE: 0.05,
  COOLDOWN_HOURS: 24,
  STREAK_RESET_HOURS: 48,
  BASE_HASH_POWER: 100,
};

export function calculateReward(streak, referralCount) {
  const streakDays = Math.min(Math.max(streak, 0), MINING_CONFIG.MAX_STREAK_BONUS_DAYS);
  const streakBonus = streakDays * MINING_CONFIG.STREAK_BONUS_PER_DAY;
  const referralBonus = Math.max(referralCount, 0) * MINING_CONFIG.REFERRAL_BONUS_PER_REFERRAL;
  return Math.round((MINING_CONFIG.BASE_REWARD + streakBonus + referralBonus) * 1000000) / 1000000;
}

export function calculateHashPower(streak, referralCount) {
  return MINING_CONFIG.BASE_HASH_POWER + streak * 5 + referralCount * 3;
}

export function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BTG-${code}`;
}

export function maskEmail(email) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}