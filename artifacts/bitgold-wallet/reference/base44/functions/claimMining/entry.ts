import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { MINING_CONFIG, calculateReward, calculateHashPower } from '../../shared/mining.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id }, { limit: 1 });
    const profile = profiles.items && profiles.items[0];
    if (!profile) return Response.json({ error: 'Profile not found. Please reload the app.' }, { status: 404 });

    const now = new Date();

    // Enforce 24h cooldown server-side
    if (profile.last_claim_date) {
      const last = new Date(profile.last_claim_date);
      const elapsedHours = (now.getTime() - last.getTime()) / 3600000;
      if (elapsedHours < MINING_CONFIG.COOLDOWN_HOURS) {
        const nextClaim = new Date(last.getTime() + MINING_CONFIG.COOLDOWN_HOURS * 3600000);
        const remainingMs = nextClaim.getTime() - now.getTime();
        return Response.json({
          error: 'cooldown',
          message: 'Next claim available soon',
          next_claim: nextClaim.toISOString(),
          remaining_ms: remainingMs
        }, { status: 429 });
      }
    }

    // Determine streak
    let newStreak = 1;
    if (profile.last_claim_date) {
      const hoursSince = (now.getTime() - new Date(profile.last_claim_date).getTime()) / 3600000;
      newStreak = hoursSince < MINING_CONFIG.STREAK_RESET_HOURS ? (profile.streak || 0) + 1 : 1;
    }

    // Count level-1 referrals for the bonus
    const l1Referrals = await base44.asServiceRole.entities.UserProfile.filter({ level1_referrer_id: profile.id }, { limit: 1000 });
    const referralCount = l1Referrals.items ? l1Referrals.items.length : 0;

    const reward = calculateReward(newStreak, referralCount);
    const hashPower = calculateHashPower(newStreak, referralCount);

    const newBalance = Math.round(((profile.balance || 0) + reward) * 1000000) / 1000000;
    const newTotalMined = Math.round(((profile.total_mined || 0) + reward) * 1000000) / 1000000;

    await base44.asServiceRole.entities.UserProfile.update(profile.id, {
      balance: newBalance,
      streak: newStreak,
      last_claim_date: now.toISOString(),
      total_mined: newTotalMined,
      total_claims: (profile.total_claims || 0) + 1,
      hash_power: hashPower
    });

    // Record the claim transaction
    await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      profile_id: profile.id,
      type: 'claim',
      amount: reward,
      description: `Daily mining claim (Day ${newStreak})`
    });

    // Credit level-1 referrer (10%)
    const l1Bonus = Math.round(reward * MINING_CONFIG.L1_RATE * 1000000) / 1000000;
    let l1Credited = false;
    let l2Credited = false;
    if (profile.level1_referrer_id && l1Bonus > 0) {
      const l1Profiles = await base44.asServiceRole.entities.UserProfile.filter({ id: profile.level1_referrer_id }, { limit: 1 });
      const l1 = l1Profiles.items && l1Profiles.items[0];
      if (l1) {
        const l1NewBalance = Math.round(((l1.balance || 0) + l1Bonus) * 1000000) / 1000000;
        const l1NewEarnings = Math.round(((l1.total_referral_earnings || 0) + l1Bonus) * 1000000) / 1000000;
        await base44.asServiceRole.entities.UserProfile.update(l1.id, {
          balance: l1NewBalance,
          total_referral_earnings: l1NewEarnings
        });
        await base44.asServiceRole.entities.Transaction.create({
          user_id: l1.user_id,
          profile_id: l1.id,
          type: 'referral_bonus_l1',
          amount: l1Bonus,
          description: '10% referral bonus (Level 1)',
          related_user_id: user.id
        });
        l1Credited = true;

        // Credit level-2 referrer (5%) — the level-1 referrer's own referrer
        if (l1.level1_referrer_id) {
          const l2Bonus = Math.round(reward * MINING_CONFIG.L2_RATE * 1000000) / 1000000;
          if (l2Bonus > 0) {
            const l2Profiles = await base44.asServiceRole.entities.UserProfile.filter({ id: l1.level1_referrer_id }, { limit: 1 });
            const l2 = l2Profiles.items && l2Profiles.items[0];
            if (l2) {
              const l2NewBalance = Math.round(((l2.balance || 0) + l2Bonus) * 1000000) / 1000000;
              const l2NewEarnings = Math.round(((l2.total_referral_earnings || 0) + l2Bonus) * 1000000) / 1000000;
              await base44.asServiceRole.entities.UserProfile.update(l2.id, {
                balance: l2NewBalance,
                total_referral_earnings: l2NewEarnings
              });
              await base44.asServiceRole.entities.Transaction.create({
                user_id: l2.user_id,
                profile_id: l2.id,
                type: 'referral_bonus_l2',
                amount: l2Bonus,
                description: '5% referral bonus (Level 2)',
                related_user_id: user.id
              });
              l2Credited = true;
            }
          }
        }
      }
    }

    return Response.json({
      success: true,
      reward,
      new_balance: newBalance,
      streak: newStreak,
      hash_power: hashPower,
      referral_count: referralCount,
      l1_bonus_credited: l1Credited,
      l2_bonus_credited: l2Credited,
      next_claim: new Date(now.getTime() + MINING_CONFIG.COOLDOWN_HOURS * 3600000).toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}