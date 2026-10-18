import { motion } from 'framer-motion';
import { Pickaxe, Users } from 'lucide-react';
import SectionHeading from './SectionHeading';

const mechanics = [
  { icon: Pickaxe, title: 'Daily mining', metric: '0.50 BTG', desc: "Claim your share of each day's rewards with a single tap. A new claim opens every 24 hours." },
  { icon: Users, title: 'Network rewards', metric: '10% · 5%', desc: 'Earn 10% of every claim your direct invites make, and 5% from their invites — credited automatically.' },
];

const formula = [
  { label: 'Base reward', value: '0.50 BTG' },
  { label: 'Network bonus (4 invites)', value: '+0.08 BTG' },
];

export default function LandingHowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-28 py-24 sm:py-32 px-5 border-t border-border/60">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="How it works"
          title={<>Mining, <span className="font-display italic font-normal text-gradient-gold">simplified.</span></>}
          desc="Bitgold turns mining into a daily habit. No hardware, no gas — just claim and grow your network."
        />
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {mechanics.map((m, i) => (
            <motion.div key={m.title} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-3xl border border-border bg-card-gradient p-6 hover:border-gold/25 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <m.icon className="w-5 h-5 text-gold" />
                </div>
                <span className="font-heading text-lg font-semibold text-gold">{m.metric}</span>
              </div>
              <h3 className="font-semibold text-lg mb-1.5">{m.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card-gradient p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">Reward formula</p>
          <div className="space-y-3">
            {formula.map((f) => (
              <div key={f.label} className="flex items-center justify-between text-sm border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-mono font-semibold">{f.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold">Today's reward</span>
              <span className="font-heading text-2xl font-semibold text-gradient-gold">0.58 BTG</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}