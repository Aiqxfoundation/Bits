import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAppData } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Share2, Users, TrendingUp, Gift, UserPlus, Loader2, BookOpen, Link as LinkIcon } from 'lucide-react';
import HowItWorksSheet from '@/components/HowItWorksSheet';

function StatCard({ icon: Icon, label, count, sub, earnings, rate, dim, hideEarnings }) {
  return (
    <div className="rounded-2xl border border-border bg-card-gradient p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dim ? 'bg-gold/10' : 'bg-gold/15'}`}>
          <Icon className={`w-4 h-4 ${dim ? 'text-gold/70' : 'text-gold'}`} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
          <div className="text-[11px] text-muted-foreground">{sub}</div>
        </div>
      </div>
      <div className="font-mono text-2xl font-bold tabular-nums leading-none">{count}</div>
      {!hideEarnings && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Earned ({rate})</span>
            <span className="text-sm font-semibold text-success font-mono tabular-nums">+{earnings} BTG</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Team() {
  const { profile, loading } = useAppData();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [howSheetOpen, setHowSheetOpen] = useState(false);

  useEffect(() => {
    base44.functions.invoke('getTeamData', {})
      .then((res) => { if (res.data) setData(res.data); })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []);

  if (loading || !profile) {
    return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /></div>;
  }

  const referralCode = data?.referral_code || profile.referral_code;
  const refLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: 'Referral code copied', description: referralCode });
  };
  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    toast({ title: 'Referral link copied', description: 'Share it with your friends' });
  };
  const shareLink = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Bitgold — BTG Mining', text: 'Mine BTG and earn rewards!', url: refLink }); } catch (e) {}
    } else {
      copyLink();
    }
  };

  const l1Count = data?.l1_count || 0;
  const l2Count = data?.l2_count || 0;
  const l1Earnings = Number(data?.l1_earnings || 0).toFixed(4);
  const l2Earnings = Number(data?.l2_earnings || 0).toFixed(4);
  const totalEarnings = Number(data?.total_referral_earnings || 0).toFixed(4);
  const referrals = data?.referrals || [];

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Team</h1>
            <p className="text-sm text-muted-foreground">Build your mining network and earn passive rewards.</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={copyCode} className="p-2 rounded-xl bg-gold/10 border border-gold/20 hover:bg-gold/15 transition-colors" aria-label="Copy referral code">
              <Copy className="w-4 h-4 text-gold" />
            </button>
            <button onClick={copyLink} className="p-2 rounded-xl bg-gold/10 border border-gold/20 hover:bg-gold/15 transition-colors" aria-label="Copy invite link">
              <LinkIcon className="w-4 h-4 text-gold" />
            </button>
            <button onClick={shareLink} className="p-2 rounded-xl bg-gold/10 border border-gold/20 hover:bg-gold/15 transition-colors" aria-label="Share invite link">
              <Share2 className="w-4 h-4 text-gold" />
            </button>
            <button onClick={() => setHowSheetOpen(true)} className="p-2 rounded-xl bg-gold/10 border border-gold/20 hover:bg-gold/15 transition-colors" aria-label="How referral rewards work">
              <BookOpen className="w-4 h-4 text-gold" />
            </button>
          </div>
        </div>
      </div>

      {/* Total earnings */}
      <div className="rounded-2xl border border-border bg-card-gradient p-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Total Referral Earnings</div>
          <div className="font-mono text-xl font-bold text-gradient-gold tabular-nums mt-0.5">{totalEarnings} BTG</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
          <Gift className="w-5 h-5 text-success" />
        </div>
      </div>

      {/* Level stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Level 1" sub="Direct referrals" count={l1Count} earnings={l1Earnings} rate="10%" hideEarnings />
        <StatCard icon={TrendingUp} label="Level 2" sub="Indirect referrals" count={l2Count} earnings={l2Earnings} rate="5%" dim hideEarnings />
      </div>

      {/* Referrals list */}
      <div>
        <h3 className="font-semibold text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 px-1">Your Referrals ({l1Count})</h3>
        {dataLoading ? (
          <div className="rounded-2xl border border-border bg-card-gradient p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 text-gold animate-spin" /> Loading…
          </div>
        ) : referrals.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card-gradient p-6 text-center">
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No referrals yet. Share your link to start building your team!</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card-gradient divide-y divide-border overflow-hidden">
            {referrals.map((r) => {
              const active = Number(r.total_mined || 0) > 0;
              return (
                <div key={r.id} className="flex items-center gap-3 p-3.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-black font-bold text-sm shrink-0">
                    {(r.display_name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.display_name}</div>
                    <div className="text-[11px] text-muted-foreground">{r.email}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-gold font-mono tabular-nums">{Number(r.total_mined || 0).toFixed(2)} BTG</div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${active ? 'text-success' : 'text-muted-foreground'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-success' : 'bg-muted-foreground/50'}`} />
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <HowItWorksSheet open={howSheetOpen} onOpenChange={setHowSheetOpen} />
    </div>
  );
}