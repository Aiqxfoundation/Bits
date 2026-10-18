import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { generateReferralCode } from '../../shared/mining.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const referredByCode = (body.referral_code || body.referralCode || '').toString().trim().toUpperCase() || null;

    // Check if profile already exists
    const existing = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id }, { limit: 1 });
    if (existing.items && existing.items.length > 0) {
      return Response.json({ profile: existing.items[0], exists: true });
    }

    // Resolve referrer chain
    let level1ReferrerId = null;
    let level2ReferrerId = null;
    if (referredByCode) {
      const referrer = await base44.asServiceRole.entities.UserProfile.filter({ referral_code: referredByCode }, { limit: 1 });
      if (referrer.items && referrer.items.length > 0) {
        const r = referrer.items[0];
        level1ReferrerId = r.id;
        level2ReferrerId = r.level1_referrer_id || null;
      }
    }

    // Generate a unique referral code
    let referralCode = generateReferralCode();
    for (let i = 0; i < 5; i++) {
      const collision = await base44.asServiceRole.entities.UserProfile.filter({ referral_code: referralCode }, { limit: 1 });
      if (!collision.items || collision.items.length === 0) break;
      referralCode = generateReferralCode();
    }

    const displayName = (user.full_name || (user.email ? user.email.split('@')[0] : 'Miner')).toString();

    const profile = await base44.asServiceRole.entities.UserProfile.create({
      user_id: user.id,
      email: user.email || '',
      display_name: displayName,
      balance: 0,
      streak: 0,
      last_claim_date: null,
      total_mined: 0,
      total_referral_earnings: 0,
      total_claims: 0,
      hash_power: 100,
      referral_code: referralCode,
      referred_by_code: referredByCode,
      level1_referrer_id: level1ReferrerId,
      level2_referrer_id: level2ReferrerId
    });

    return Response.json({ profile, exists: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}