import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Gift } from 'lucide-react';

const STEPS = [
  { n: '1', text: <>Share your link. Friends who join become your <span className="text-foreground font-medium">Level 1</span> referrals.</> },
  { n: '2', text: <>Earn <span className="text-gold font-semibold">10%</span> of every BTG your Level 1 referrals mine — automatically.</> },
  { n: '3', text: <>When they invite others, those become <span className="text-foreground font-medium">Level 2</span> — you earn <span className="text-gold font-semibold">5%</span> of their mining.</> },
];

export default function HowItWorksSheet({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="left-1/2 right-auto -translate-x-1/2 w-[calc(100%-2rem)] max-w-md rounded-3xl border border-border bg-card mb-4"
      >
        <SheetHeader className="text-center">
          <SheetTitle className="flex items-center justify-center gap-2">
            <Gift className="w-4 h-4 text-gold" /> How Referral Rewards Work
          </SheetTitle>
          <SheetDescription>Two levels of passive mining rewards</SheetDescription>
        </SheetHeader>
        <div className="px-1 pb-6 space-y-3 mt-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-bold flex items-center justify-center shrink-0">{s.n}</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}