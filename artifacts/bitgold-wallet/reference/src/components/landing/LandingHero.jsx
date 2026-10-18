import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroPhone from './HeroPhone';

export default function LandingHero({ onEnter }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gold/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center lg:text-left">
          <a href="#protocol" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 pl-1.5 pr-3 py-1 text-xs text-muted-foreground hover:border-gold/40 transition-colors mb-8">
            <span className="rounded-full bg-gold/15 text-gold px-2 py-0.5 font-semibold">Live</span>
            Mining phase is open <ArrowRight className="w-3 h-3" />
          </a>

          <h1 className="text-[44px] leading-[1.02] sm:text-6xl lg:text-[64px] font-semibold tracking-[-0.035em] mb-6">
            The <span className="font-display italic font-normal text-gradient-gold pr-1">gold standard</span> for digital payments
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-9 leading-relaxed">
            Bitgold is a Layer-1 payment network built for speed, scarcity and self-custody. Mine BTG from your phone and own a share of the network from day one.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Button onClick={onEnter} size="lg" className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-semibold rounded-full h-12 px-7 text-base">
              Start mining <ArrowRight className="w-4 h-4" />
            </Button>
            <Link to="/goldpaper" className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-border bg-card/40 hover:bg-secondary transition-colors font-medium">
              Read the Goldpaper
            </Link>
          </div>
        </motion.div>

        <HeroPhone />
      </div>
    </section>
  );
}