import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const MASK = '••••••';

export default function WalletHero({ usdValue, btgBalance }) {
  const [hidden, setHidden] = useState(false);

  const usd = `$${Number(usdValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const btg = `${Number(btgBalance).toFixed(4)} BTG`;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card-gradient p-6 mb-2">
      <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Total Balance</p>
          <button
            onClick={() => setHidden((h) => !h)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-end gap-1.5 mb-1">
          <span className="font-heading text-4xl font-bold tracking-tight tabular-nums leading-none">
            {hidden ? MASK : usd}
          </span>
          <span className="text-base font-semibold text-muted-foreground mb-0.5">USDT</span>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">≈ {hidden ? MASK : btg}</p>
      </div>
    </div>
  );
}