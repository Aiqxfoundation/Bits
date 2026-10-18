import Logo from '@/components/Logo';

// Compact, professional mining card: coin logo, live ticking counter, hash power, progress.
export default function MiningRig({ reward = 0.5, canClaim = false, mined = 0, hashPower = 100 }) {
  const pct = canClaim ? 100 : Math.min(100, (mined / reward) * 100);

  return (
    <div className="relative rounded-3xl border border-border bg-card-gradient p-5 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.18] pointer-events-none" />

      <div className="relative flex items-center gap-4">
        <Logo size={52} glow={canClaim} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mining BTG</div>
          <div className="font-mono text-xl font-bold text-gradient-gold tabular-nums truncate leading-tight mt-0.5">
            {mined.toFixed(6)}
            <span className="text-sm text-muted-foreground font-normal ml-1">BTG</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Hash</div>
          <div className="font-mono text-sm font-semibold tabular-nums">{hashPower.toLocaleString()}<span className="text-muted-foreground font-normal ml-0.5">H/s</span></div>
        </div>
      </div>

      <div className="relative mt-4 h-1 rounded-full bg-border overflow-hidden">
        <div className="h-full bg-gradient-gold transition-all duration-1000 ease-linear" style={{ width: `${pct}%` }} />
      </div>

      <div className="relative mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className={`w-1.5 h-1.5 rounded-full ${canClaim ? 'bg-success animate-pulse' : 'bg-gold/60'}`} />
          {canClaim ? 'Ready to claim' : 'Mining in progress'}
        </span>
        <span className="text-muted-foreground">Daily <span className="text-gold font-semibold ml-0.5">{reward.toFixed(2)} BTG</span></span>
      </div>
    </div>
  );
}