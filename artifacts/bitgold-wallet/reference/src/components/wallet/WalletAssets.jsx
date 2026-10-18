import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import TokenIcon from './TokenIcon';
import { ASSETS } from './assets';

export default function WalletAssets({ profile, txs }) {
  const btgBalance = Number(profile.balance || 0);

  return (
    <div className="border-t border-border pt-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">Assets</p>
      {ASSETS.map((asset) => {
        const balance = asset.kind === 'btg' ? btgBalance : 0;
        return (
          <Link
            key={asset.symbol}
            to={`/app/wallet/${asset.symbol.toLowerCase()}`}
            className="w-full flex items-center gap-3 rounded-2xl px-1 py-3 hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
          >
            <TokenIcon kind={asset.kind} size={40} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold leading-tight">{asset.name}</div>
              <div className="text-xs text-muted-foreground">{asset.symbol}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-semibold tabular-nums">{balance.toFixed(4)}</div>
              <div className="text-xs text-muted-foreground">{asset.symbol}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}