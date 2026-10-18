import Logo from '@/components/Logo';
import { ArrowUpRight, ArrowDownLeft, Pickaxe, Users } from 'lucide-react';

const actions = [{ icon: ArrowUpRight, label: 'Send' }, { icon: ArrowDownLeft, label: 'Receive' }, { icon: Pickaxe, label: 'Mine' }];
const activity = [
  { icon: Pickaxe, label: 'Daily mining', sub: 'Streak · day 23', value: '+0.73' },
  { icon: Users, label: 'Network bonus', sub: 'Level 1 invite', value: '+0.07' },
  { icon: Pickaxe, label: 'Daily mining', sub: 'Streak · day 22', value: '+0.72' },
];

export default function PhoneScreen() {
  return (
    <div className="h-[540px] sm:h-[590px] px-4 pt-3 pb-5 text-left">
      <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-5 px-1">
        <span className="font-semibold text-foreground">9:41</span>
        <div className="w-20 h-5 rounded-full bg-black" />
        <span>5G</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Logo size={22} />
        <span className="text-sm font-semibold">Bitgold</span>
      </div>

      <p className="text-[11px] text-muted-foreground mb-1">Total balance</p>
      <p className="font-heading text-[34px] font-semibold tracking-tight leading-none mb-2">48.2650 <span className="text-base text-muted-foreground">BTG</span></p>
      <p className="text-xs text-success mb-6">+0.80 BTG today</p>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {actions.map((a, i) => (
          <div key={a.label} className="flex flex-col items-center gap-1.5">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${i === 2 ? 'bg-gradient-gold text-primary-foreground' : 'bg-secondary text-foreground'}`}>
              <a.icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-muted-foreground">{a.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-3.5 mb-5">
        <div className="flex justify-between text-[11px] mb-2">
          <span className="text-muted-foreground">Next claim in</span>
          <span className="font-mono font-semibold">08:42:17</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full w-[64%] bg-gradient-gold rounded-full" />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mb-2.5">Recent activity</p>
      <div className="space-y-3">
        {activity.map((a, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center"><a.icon className="w-3.5 h-3.5 text-gold" /></div>
            <div className="flex-1">
              <p className="text-xs font-medium leading-none mb-1">{a.label}</p>
              <p className="text-[10px] text-muted-foreground leading-none">{a.sub}</p>
            </div>
            <span className="text-xs font-semibold text-success">{a.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}