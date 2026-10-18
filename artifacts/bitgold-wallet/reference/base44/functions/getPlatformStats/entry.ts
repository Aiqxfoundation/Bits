import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { MINING_CONFIG } from '../../shared/mining.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const totalMiners = await base44.asServiceRole.entities.UserProfile.count({});

    let totalMined = 0;
    try {
      const agg = await base44.asServiceRole.entities.UserProfile.aggregate({ sum: 'total_mined' });
      if (agg && agg.rows && agg.rows.length > 0) {
        totalMined = Number(agg.rows[0].sum_total_mined) || 0;
      }
    } catch (e) {
      totalMined = 0;
    }

    const remainingSupply = Math.max(MINING_CONFIG.TOTAL_SUPPLY - totalMined, 0);

    return Response.json({
      total_miners: totalMiners,
      total_mined: Math.round(totalMined * 100) / 100,
      total_supply: MINING_CONFIG.TOTAL_SUPPLY,
      remaining_supply: Math.round(remainingSupply * 100) / 100,
      circulating_percent: Math.round((totalMined / MINING_CONFIG.TOTAL_SUPPLY) * 10000) / 100
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}