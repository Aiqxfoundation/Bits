import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { useAppData } from '@/components/AppLayout';
import MiningRig from '@/components/MiningRig';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pickaxe, Users, ArrowRight, Sparkles } from 'lucide-react';

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const BASE_REWARD = 0.5;

export default function Dashboard() {
  const { profile, loading, reload } = useAppData();
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [claimResult, setClaimResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  const lastClaim = profile.last_claim_date ? new Date(profile.last_claim_date).getTime() : 0;
  const nextClaim = lastClaim + COOLDOWN_MS;
  const canClaim = !profile.last_claim_date || now >= nextClaim;
  const remaining = Math.max(0, nextClaim - now);
  const progress = canClaim ? 100 : Math.min(100, Math.max(0, ((now - lastClaim) / COOLDOWN_MS) * 100));
  const mined = canClaim ? BASE_REWARD : (progress / 100) * BASE_REWARD;

  const handleClaim = async () => {
    if (!canClaim || claiming) return;
    setClaiming(true);
    setClaimResult(null);
    try {
      const res = await base44.functions.invoke('claimMining', {});
      if (res.data && res.data.success) {
        confetti({ particleCount: 140, spread: 75, origin: { y: 0.45 }, colors: ['#F0B90B', '#FFE082', '#B8860B', '#FFD75E'] });
        setClaimResult(res.data);
        await reload();
      } else if (res.data && res.data.error === 'cooldown') {
        await reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <MiningRig reward={BASE_REWARD} canClaim={canClaim} mined={mined} hashPower={profile.hash_power || 100} />

      <div className="text-center">
        {claimResult && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/15 border border-success/30 text-success text-sm font-semibold">
            <Sparkles className="w-4 h-4" /> +{claimResult.reward} BTG claimed!
          </motion.div>
        )}

        {canClaim ? (
          <Button onClick={handleClaim} disabled={claiming}
            className="bg-gradient-gold text-black hover:opacity-90 font-bold text-lg h-14 px-10 rounded-2xl w-full max-w-xs shadow-lg shadow-gold/20">
            {claiming ? (
              <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" /> Claiming…</>
            ) : (
              <><Pickaxe className="w-5 h-5 mr-2" /> Claim BTG</>
            )}
          </Button>
        ) : (
          <div className="max-w-xs mx-auto rounded-2xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">Next claim in</div>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              {['HRS', 'MIN', 'SEC'].map((u, i) => {
                const v = [Math.floor(remaining / 3600000), Math.floor((remaining % 3600000) / 60000), Math.floor((remaining % 60000) / 1000)][i];
                return (
                  <div key={u} className="flex items-center gap-1.5">
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-2xl font-bold text-gold tabular-nums leading-none">{String(v).padStart(2, '0')}</span>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{u}</span>
                    </div>
                    {i < 2 && <span className="text-2xl font-bold text-muted-foreground/40 -mt-3">:</span>}
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-1 mt-3 [&>div]:bg-gold" />
          </div>
        )}
      </div>

      <div className="rounded-2xl p-4 bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Earn 10% from referrals</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Invite friends and earn 10% of their mining, plus 5% from their referrals.</p>
            <Button onClick={() => navigate('/app/team')} variant="outline" size="sm" className="mt-2.5 rounded-full border-gold/30 text-gold hover:bg-gold/10">
              View Team <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}