import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import SectionHeading from './SectionHeading';

const roadmap = [
  { phase: 'Phase 1', title: 'Mining distribution', status: 'Live', desc: 'BTG distributed via daily mining and referrals. Building the community and network effect.', done: true },
  { phase: 'Phase 2', title: 'Multichain testnet', status: 'Live', desc: 'BTG deployed as a multichain token across major EVM networks with cross-chain bridges and wallet integrations.', done: true },
  { phase: 'Phase 3', title: 'Mainnet launch', status: 'Q4 2026', desc: 'Full mainnet deployment with decentralized validators, staking, and the complete 21M supply locked.', done: false },
  { phase: 'Phase 4', title: 'L1 payment chain', status: '2027', desc: 'Launch the Bitgold Layer-1 blockchain — a high-throughput payment network using BTG as gas.', done: false },
  { phase: 'Phase 5', title: 'Exchange listing', status: 'Q1 2027', desc: 'Official mainnet exchange listing of BTG across major centralized and decentralized exchanges.', done: false },
];

export default function LandingRoadmap() {
  return (
    <section id="roadmap" className="relative scroll-mt-28 py-24 sm:py-32 px-5 border-t border-border/60">
      <div className="max-w-3xl mx-auto">
        <SectionHeading
          eyebrow="Roadmap"
          title={<>From mining to <span className="font-display italic font-normal text-gradient-gold">mainnet</span></>}
          desc="A phased path from community distribution to a Layer-1 payment chain."
        />
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-5">
            {roadmap.map((r, i) => (
              <motion.div key={i} initial={{ x: 20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
                className="relative pl-14">
                <div className={`absolute left-2.5 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center -translate-x-1/2 ${r.done ? 'bg-gold border-gold' : 'bg-card border-border'}`}>
                  {r.done && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                </div>
                <div className={`rounded-3xl border p-5 sm:p-6 ${r.done ? 'border-gold/30 bg-gradient-to-r from-gold/10 to-transparent' : 'border-border bg-card-gradient'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{r.phase}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${r.done ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'}`}>{r.status}</span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-1.5">{r.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}