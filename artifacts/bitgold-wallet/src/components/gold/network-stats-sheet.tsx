import { Activity, Database, Pickaxe, Users } from 'lucide-react';
import type { PlatformStats } from '@workspace/api-client-react';
import { Sheet, SheetRow } from '@/components/sheet';

/** Planned maximum supply, as published on the Bitgold goldpaper. */
const MAX_SUPPLY = 21_000_000;

export function NetworkStatsSheet({ open, onClose, stats }: {
  open: boolean; onClose: () => void; stats?: PlatformStats;
}) {
  const totalUsers = stats?.totalUsers ?? 0;
  const totalMined = stats?.totalMined ?? 0;
  const activeMiners = stats?.activeMiners ?? 0;
  const totalClaims = stats?.totalClaims ?? 0;
  const circulating = Math.min(100, (totalMined / MAX_SUPPLY) * 100);
  const remaining = Math.max(0, MAX_SUPPLY - totalMined);

  return <Sheet open={open} onClose={onClose} title="Network statistics" description="Live Bitgold protocol metrics">
    {stats ? <div className="sheet-stack" data-testid="content-network-stats">
      <SheetRow icon={<Users size={18} />} label="Total registered users" value={totalUsers.toLocaleString()} sub={`${activeMiners.toLocaleString()} claimed in the last 24 hours`} />
      <SheetRow icon={<Pickaxe size={18} />} label="Total mined BTG" value={`${totalMined.toLocaleString()} BTG`} sub={`${circulating.toFixed(2)}% of maximum supply`} />
      <SheetRow icon={<Database size={18} />} label="Remaining supply" value={`${remaining.toLocaleString()} BTG`} sub={`Maximum supply: ${MAX_SUPPLY.toLocaleString()} BTG`} />
      <SheetRow icon={<Activity size={18} />} label="Total mining claims" value={totalClaims.toLocaleString()} sub="Daily claims recorded by the account service" />
    </div> : <p className="muted sheet-note">Network statistics are momentarily unavailable. They are read from the Bitgold account service.</p>}
  </Sheet>;
}
