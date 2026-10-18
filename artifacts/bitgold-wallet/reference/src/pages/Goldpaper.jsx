import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pickaxe, ShieldCheck, Coins } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingTokenomics from '@/components/landing/LandingTokenomics';
import LandingRoadmap from '@/components/landing/LandingRoadmap';
import LandingFooter from '@/components/landing/LandingFooter';

const toc = [
  { id: 'how', label: 'How it works' },
  { id: 'tokenomics', label: 'Tokenomics' },
  { id: 'roadmap', label: 'Roadmap' },
];

const principles = [
  { icon: Pickaxe, title: 'Fair launch', desc: 'No premine, no VC privileges. The majority of supply is distributed to the community through mining.' },
  { icon: ShieldCheck, title: 'Fixed supply', desc: '21,000,000 BTG hard cap. No future minting — ever. Scarcity is encoded into the protocol.' },
  { icon: Coins, title: 'Payment layer', desc: 'BTG is the native currency of a high-throughput Layer-1 built for fast, low-cost payments.' },
];

export default function Goldpaper() {
  const navigate = useNavigate();
  const enter = () => navigate('/app');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="font-heading font-semibold text-lg tracking-tight">Bitgold</span>
            <span className="text-[10px] font-medium text-gold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20">Goldpaper</span>
          </Link>
          <Button onClick={enter} className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold px-5 h-9">
            Launch App
          </Button>
        </div>
      </header>

      {/* Intro */}
      <section id="overview" className="relative overflow-hidden px-5 pt-16 pb-12 sm:pt-24">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gold/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold mb-4">The Bitgold Goldpaper</p>
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-[-0.035em] leading-[1.05] mb-6">
              A <span className="font-display italic font-normal text-gradient-gold">Bitcoin-standard</span> payment chain
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              The technical and economic design of the Bitgold protocol — a fixed-supply, fair-launch Layer-1 built as a multichain payment network.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 mt-14 text-left">
            {principles.map((p, i) => (
              <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.1 }}
                className="rounded-3xl border border-border bg-card-gradient p-6">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-semibold mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TOC */}
      <div className="sticky top-16 z-40 backdrop-blur-xl bg-background/70 border-y border-border/60">
        <nav className="max-w-6xl mx-auto flex items-center justify-center gap-2 px-5 py-3 overflow-x-auto scrollbar-hide">
          {toc.map((item) => (
            <a key={item.id} href={`#${item.id}`}
              className="px-3.5 py-1.5 rounded-full border border-border bg-card/40 text-xs text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors whitespace-nowrap">
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Sections */}
      <LandingHowItWorks />
      <LandingTokenomics />
      <LandingRoadmap />

      <LandingFooter />
    </div>
  );
}