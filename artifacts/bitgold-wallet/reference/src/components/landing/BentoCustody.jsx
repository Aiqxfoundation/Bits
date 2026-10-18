import { CheckCircle2, Wallet } from 'lucide-react';
import BentoCard from './BentoCard';

export default function BentoCustody({ className }) {
  return (
    <BentoCard className={className} eyebrow="Self-custody" title="Your keys, your BTG"
      desc="Withdraw to any wallet you control. Every movement is recorded on your personal ledger.">
      <div className="w-full rounded-2xl border border-border bg-background/60 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <Wallet className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-none mb-1">Withdrawal</p>
            <p className="text-[11px] font-mono text-muted-foreground leading-none">0x8f3c…a91c</p>
          </div>
          <p className="text-sm font-semibold">25.00 BTG</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-success">
          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
        </div>
      </div>
    </BentoCard>
  );
}