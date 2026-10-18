import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useAppData } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useToast } from '@/components/ui/use-toast';
import StatCard from '@/components/StatCard';
import Logo from '@/components/Logo';
import { Flame, Zap, Gift, Pickaxe, Users, LogOut, Copy, Settings, BookOpen, ChevronRight } from 'lucide-react';

export default function Profile() {
  const { profile, loading, reload } = useAppData();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading || !profile) {
    return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /></div>;
  }

  const copyCode = () => {
    navigator.clipboard.writeText(profile.referral_code);
    toast({ title: 'Referral code copied' });
  };

  const startEdit = () => {
    setName(profile.display_name || '');
    setCountry(profile.country || '');
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('updateProfile', { display_name: name, country });
      if (res.data && res.data.success) {
        toast({ title: 'Profile updated' });
        setEditing(false);
        await reload();
      }
    } catch (e) {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const docs = [
    {
      title: 'Overview & Vision',
      content: (
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>Bitgold (BTG) is a fixed-supply digital asset and the native token of the future Bitgold payment network. Inspired by Bitcoin's scarcity but built for speed, Bitgold solves the high transaction cost and scalability problems that limit Bitcoin as an everyday payment method.</p>
          <p>BTG is distributed entirely for free through mining and referrals — no presale, no ICO, no team allocation that dumps on the market. Every token is earned by participation.</p>
        </div>
      ),
    },
    {
      title: 'Tokenomics',
      content: (
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p><span className="text-foreground font-semibold">Ticker:</span> BTG</p>
          <p><span className="text-foreground font-semibold">Total Supply:</span> 21,000,000 BTG (fixed, never minted again)</p>
          <p><span className="text-foreground font-semibold">Distribution:</span> 70% mining rewards · 20% referral bonuses · 7% ecosystem & liquidity · 3% team & development (locked).</p>
          <p>The supply is hard-capped at 21 million — the same as Bitcoin — ensuring long-term scarcity. No additional tokens can ever be created.</p>
        </div>
      ),
    },
    {
      title: 'Mining Mechanics',
      content: (
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>Every user can claim a mining reward once every 24 hours. Your reward grows with your streak (consecutive days claimed) and your referral count:</p>
          <p>· Base reward: 0.5 BTG per claim</p>
          <p>· Streak bonus: +0.01 BTG per consecutive day (up to 30 days)</p>
          <p>· Referral bonus: +0.02 BTG per active referral</p>
          <p>Missing a day resets your streak to day 1, so consistency matters.</p>
        </div>
      ),
    },
    {
      title: 'Referral System',
      content: (
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>Share your referral link to build a two-level mining network:</p>
          <p>· <span className="text-gold font-semibold">Level 1 (Direct):</span> 10% of everything your direct referrals mine.</p>
          <p>· <span className="text-gold font-semibold">Level 2 (Indirect):</span> 5% of what your referrals' referrals mine.</p>
          <p>Bonuses are credited to your balance automatically every time a referral claims — no action needed.</p>
        </div>
      ),
    },
    {
      title: 'Multichain & Gas Utility',
      content: (
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>BTG is designed as a multichain asset, deployable across major EVM networks with cross-chain bridges. On the future Bitgold Layer-1, BTG serves as the gas and payment asset — every transaction, smart contract, and transfer requires BTG, creating constant demand.</p>
          <p>By using BTG for gas instead of BTC, the network achieves dramatically lower transaction costs while preserving the scarcity model users trust.</p>
        </div>
      ),
    },
    {
      title: 'Roadmap',
      content: (
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p><span className="text-success font-semibold">Phase 1 — Free Mining (Live):</span> Community building via free daily mining and referrals.</p>
          <p><span className="text-foreground font-semibold">Phase 2 — Multichain Testnet (Q2 2026):</span> BTG deployed across EVM chains with bridging.</p>
          <p><span className="text-foreground font-semibold">Phase 3 — Mainnet (Q4 2026):</span> Full mainnet with validators, staking, and locked supply.</p>
          <p><span className="text-foreground font-semibold">Phase 4 — L1 Payment Chain (2027):</span> The Bitgold blockchain — high-throughput payments using BTG as gas.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-3xl border border-border bg-card-gradient p-6 text-center relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-gold/10 to-transparent" />
        <div className="relative">
          <Avatar className="w-20 h-20 mx-auto mb-3 border-2 border-gold/30">
            <AvatarFallback className="bg-gradient-gold text-black text-2xl font-bold">
              {(profile.display_name || 'U').slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold">{profile.display_name}</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <button onClick={copyCode} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-sm font-mono text-gold hover:bg-gold/20 transition-colors">
            {profile.referral_code} <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Flame} label="Streak" value={`${profile.streak || 0}d`} accent />
        <StatCard icon={Zap} label="Hash Power" value={`${profile.hash_power || 100}`} />
        <StatCard icon={Gift} label="Total Mined" value={Number(profile.total_mined || 0).toFixed(3)} />
        <StatCard icon={Users} label="Referral Earn" value={Number(profile.total_referral_earnings || 0).toFixed(3)} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gold" />
            <h3 className="font-semibold">Account Settings</h3>
          </div>
          {!editing && <Button variant="ghost" size="sm" onClick={startEdit} className="text-gold">Edit</Button>}
        </div>
        {editing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-background" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Pakistan" className="mt-1 bg-background" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
              <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-gold text-black hover:bg-gold-bright rounded-xl">
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Display Name</span><span className="font-medium">{profile.display_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="font-medium">{profile.country || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Member Since</span><span className="font-medium">{new Date(profile.created_date).toLocaleDateString()}</span></div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-gold" />
          <h3 className="font-semibold">Documentation</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">The complete Bitgold whitepaper — tokenomics, mining, and roadmap.</p>
        <Accordion type="single" collapsible className="w-full">
          {docs.map((d, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-sm hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gold/10 text-gold text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                  {d.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3">{d.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Button onClick={handleLogout} variant="outline" className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 h-12">
        <LogOut className="w-4 h-4 mr-2" /> Log Out
      </Button>

      <div className="flex items-center justify-center gap-2 pt-2 pb-4">
        <Logo size={18} />
        <span className="text-xs text-muted-foreground">Bitgold Network · BTG · v1.0</span>
      </div>
    </div>
  );
}