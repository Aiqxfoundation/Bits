import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const walletAddress = (body.wallet_address || '').toString().trim();

    if (!amount || amount <= 0) return Response.json({ error: 'Enter a valid amount' }, { status: 400 });
    if (!walletAddress || walletAddress.length < 10) return Response.json({ error: 'Enter a valid wallet address' }, { status: 400 });
    if (amount < 1) return Response.json({ error: 'Minimum withdrawal is 1 BTG' }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id }, { limit: 1 });
    const profile = profiles.items && profiles.items[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    if ((profile.balance || 0) < amount) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Debit balance and create the withdrawal request
    const newBalance = Math.round(((profile.balance || 0) - amount) * 1000000) / 1000000;
    await base44.asServiceRole.entities.UserProfile.update(profile.id, {
      balance: newBalance
    });

    const withdrawal = await base44.asServiceRole.entities.Withdrawal.create({
      user_id: user.id,
      profile_id: profile.id,
      amount,
      wallet_address: walletAddress,
      network: 'BTG Mainnet',
      status: 'pending'
    });

    await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      profile_id: profile.id,
      type: 'withdrawal',
      amount: -Math.abs(amount),
      description: `Withdrawal to ${walletAddress.slice(0, 8)}…`,
      withdrawal_id: withdrawal.id
    });

    return Response.json({ success: true, withdrawal, new_balance: newBalance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}