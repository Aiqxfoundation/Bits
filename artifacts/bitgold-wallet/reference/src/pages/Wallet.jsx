import { useAppData } from '@/components/AppLayout';
import WalletHero from '@/components/wallet/WalletHero';
import WalletAssets from '@/components/wallet/WalletAssets';
import { BTG_USDT_RATE } from '@/components/wallet/assets';

export default function Wallet() {
  const { profile, loading } = useAppData();

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  const balance = Number(profile.balance || 0);
  const usdValue = balance * BTG_USDT_RATE;

  return (
    <div className="px-4 py-4 pb-24">
      <WalletHero usdValue={usdValue} btgBalance={balance} />
      <WalletAssets profile={profile} />
    </div>
  );
}