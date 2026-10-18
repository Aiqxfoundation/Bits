import { ArrowLeftRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export default function TransferSheet({ open, onOpenChange, balance }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
        <SheetHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gold/15 flex items-center justify-center mb-2">
            <ArrowLeftRight className="w-6 h-6 text-gold" />
          </div>
          <SheetTitle>Transfer BTG</SheetTitle>
          <SheetDescription>Send BTG to another Bitgold user by username or wallet address.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8 pt-2 text-center">
          <div className="rounded-2xl border border-border bg-secondary/30 p-5">
            <p className="text-sm text-muted-foreground">
              Transfers are coming soon. Available balance: <span className="font-semibold text-foreground tabular-nums">{Number(balance || 0).toFixed(4)} BTG</span>
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}