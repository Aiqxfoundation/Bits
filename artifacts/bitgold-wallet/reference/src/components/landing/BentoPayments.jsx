import { ArrowRight, Store } from 'lucide-react';
import BentoCard from './BentoCard';
import Logo from '@/components/Logo';

export default function BentoPayments({ className }) {
  return (
    <BentoCard className={className} eyebrow="Payments · coming with mainnet" title="Built for everyday payments"
      desc="BTG is designed as the native currency of a high-throughput Layer-1 — fast settlement, minimal fees and a supply that can never be inflated.">
      <div className="w-full rounded-2xl border border-border bg-background/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Logo size={36} />
          <div>
            <p className="text-[11px] text-muted-foreground leading-none mb-1.5">You pay</p>
            <p className="font-heading text-lg font-semibold leading-none">12.50 BTG</p>
          </div>
        </div>
        <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <Store className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground leading-none mb-1.5">Merchant receives</p>
            <p className="font-heading text-lg font-semibold leading-none">12.50 BTG</p>
          </div>
        </div>
        <span className="self-start sm:self-center text-[11px] rounded-full bg-success/10 text-success px-2.5 py-1 font-medium">Settled</span>
      </div>
    </BentoCard>
  );
}