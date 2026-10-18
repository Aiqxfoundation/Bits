import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { maskEmail } from '../../shared/mining.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id }, { limit: 1 });
    const profile = profiles.items && profiles.items[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const [l1Res, l2Res] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ level1_referrer_id: profile.id }, { limit: 1000, sort: '-created_date' }),
      base44.asServiceRole.entities.UserProfile.filter({ level2_referrer_id: profile.id }, { limit: 1000 })
    ]);

    const l1Count = l1Res.items ? l1Res.items.length : 0;
    const l2Count = l2Res.items ? l2Res.items.length : 0;

    let l1Earnings = 0;
    let l2Earnings = 0;
    try {
      const [agg1, agg2] = await Promise.all([
        base44.asServiceRole.entities.Transaction.aggregate({ query: { user_id: user.id, type: 'referral_bonus_l1' }, sum: 'amount' }),
        base44.asServiceRole.entities.Transaction.aggregate({ query: { user_id: user.id, type: 'referral_bonus_l2' }, sum: 'amount' })
      ]);
      if (agg1 && agg1.rows && agg1.rows.length > 0) l1Earnings = Number(agg1.rows[0].sum_amount) || 0;
      if (agg2 && agg2.rows && agg2.rows.length > 0) l2Earnings = Number(agg2.rows[0].sum_amount) || 0;
    } catch (e) {
      l1Earnings = 0;
      l2Earnings = 0;
    }

    const referrals = (l1Res.items || []).map((p) => ({
      id: p.id,
      display_name: p.display_name,
      email: maskEmail(p.email),
      joined: p.created_date,
      total_mined: p.total_mined || 0,
      streak: p.streak || 0,
      status: 'active'
    }));

    return Response.json({
      referral_code: profile.referral_code,
      l1_count: l1Count,
      l2_count: l2Count,
      l1_earnings: Math.round(l1Earnings * 1000000) / 1000000,
      l2_earnings: Math.round(l2Earnings * 1000000) / 1000000,
      total_referral_earnings: profile.total_referral_earnings || 0,
      referrals
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}