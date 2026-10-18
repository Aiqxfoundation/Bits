import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ArrowUpRight, AlertTriangle } from 'lucide-react';

export default function WithdrawDialog({ open, onOpenChange, balance, onSuccess }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    if (amt < 1) {
      toast({ title: 'Minimum withdrawal is 1 BTG', variant: 'destructive' });
      return;
    }
    if (!address || address.length < 10) {
      toast({ title: 'Enter a valid wallet address', variant: 'destructive' });
      return;
    }
    if (amt > balance) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('requestWithdrawal', { amount: amt, wallet_address: address });
      if (res.data && res.data.success) {
        toast({ title: 'Withdrawal submitted', description: `${amt} BTG is now processing` });
        onOpenChange(false);
        setAmount('');
        setAddress('');
        onSuccess();
      } else if (res.data && res.data.error) {
        toast({ title: res.data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Withdrawal failed', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-gold flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-black" />
            </div>
            Withdraw BTG
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-2xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 p-3">
            <div className="text-[11px] text-muted-foreground">Available Balance</div>
            <div className="text-2xl font-bold tabular-nums">
              {balance.toFixed(4)} <span className="text-sm text-gold">BTG</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Amount (min 1 BTG)</Label>
            <Input
              type="number"
              placeholder="0.0000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5 bg-background text-lg tabular-nums"
            />
            <div className="flex gap-2 mt-1.5">
              {[0.25, 0.5, 0.75, 1].map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(String((balance * p).toFixed(4)))}
                  className="flex-1 text-[11px] py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground transition-colors"
                >
                  {p * 100}%
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Wallet Address (BTG Mainnet)</Label>
            <Input
              placeholder="Enter your BTG wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1.5 bg-background font-mono text-xs"
            />
          </div>
          <div className="flex gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive/90">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Double-check your address. Transactions on the BTG network are irreversible.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting} className="bg-gradient-gold text-black hover:opacity-90 rounded-xl font-semibold">
            {submitting ? 'Submitting…' : 'Submit Withdrawal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}