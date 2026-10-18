import { User, Users, UsersRound } from 'lucide-react';
import BentoCard from './BentoCard';

const tiers = [
  { icon: User, label: 'You', rate: 'Owner', indent: 'ml-0', highlight: false },
  { icon: Users, label: 'Direct invites', rate: '10%', indent: 'ml-4', highlight: true },
  { icon: UsersRound, label: 'Their invites', rate: '5%', indent: 'ml-8', highlight: true },
];

export default function BentoNetwork({ className }) {
  return (
    <BentoCard className={className} eyebrow="Network rewards" title="Earn with your network"
      desc="Earn a share of every claim your invites make — two levels deep, credited automatically.">
      <div className="w-full space-y-2">
        {tiers.map((t) => (
          <div key={t.label} className={`${t.indent} flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-3`}>
            <t.icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm flex-1">{t.label}</span>
            <span className={`text-xs font-semibold ${t.highlight ? 'text-gold' : 'text-muted-foreground'}`}>{t.rate}</span>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}