import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Users, Pickaxe, Database, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function StatRow({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-4">
      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-lg font-bold text-gradient-gold tabular-nums leading-tight mt-0.5 truncate">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function StatsSheet({ open, onOpenChange }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    base44.functions.invoke('getPlatformStats', {})
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="left-1/2 right-auto -translate-x-1/2 w-[calc(100%-2rem)] max-w-md rounded-3xl border border-border bg-card mb-4">
        <SheetHeader className="text-center">
          <SheetTitle>Network Statistics</SheetTitle>
          <SheetDescription>Live Bitgold protocol metrics</SheetDescription>
        </SheetHeader>
        <div className="px-1 pb-6 space-y-3 mt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
            </div>
          )}
          {!loading && stats && !stats.error && (
            <>
              <StatRow
                icon={Users}
                label="Total Registered Users"
                value={Number(stats.total_miners || 0).toLocaleString()}
                sub="Active miners on the network"
              />
              <StatRow
                icon={Pickaxe}
                label="Total Mined BTG"
                value={`${Number(stats.total_mined || 0).toLocaleString()} BTG`}
                sub={`${stats.circulating_percent || 0}% of total supply`}
              />
              <StatRow
                icon={Database}
                label="Remaining Supply"
                value={`${Number(stats.remaining_supply || 0).toLocaleString()} BTG`}
                sub={`Hard cap: ${Number(stats.total_supply || 0).toLocaleString()} BTG`}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}