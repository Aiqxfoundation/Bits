import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Copy, Check, Pickaxe, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ReceiveSheet({ open, onOpenChange, profile }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(null);
  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code || ''}`;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-3xl">
        <SheetHeader className="text-center">
          <SheetTitle>Receive BTG</SheetTitle>
          <SheetDescription>BTG is earned through mining and referrals</SheetDescription>
        </SheetHeader>
        <div className="px-1 pb-6 space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-transparent p-4">
              <Pickaxe className="w-5 h-5 text-gold mb-2" />
              <div className="text-sm font-semibold">Mine Daily</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Claim every 24h to grow your balance</div>
            </div>
            <div className="rounded-2xl border border-success/20 bg-gradient-to-br from-success/10 to-transparent p-4">
              <Users className="w-5 h-5 text-success mb-2" />
              <div className="text-sm font-semibold">Build Your Team</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Earn 10% L1 + 5% L2 on claims</div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="text-[11px] text-muted-foreground mb-1.5">Your Referral Code</div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-gold flex-1">{profile?.referral_code}</span>
              <Button size="icon" variant="ghost" onClick={() => copy(profile?.referral_code, 'code')} className="h-8 w-8 shrink-0">
                {copied === 'code' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="text-[11px] text-muted-foreground mb-1.5">Your Invite Link</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs truncate flex-1">{referralLink}</span>
              <Button size="sm" variant="outline" onClick={() => copy(referralLink, 'link')} className="shrink-0 rounded-lg">
                {copied === 'link' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                Copy
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}