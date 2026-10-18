import { motion } from 'framer-motion';
import BentoCard from './BentoCard';

const bars = [38, 44, 41, 52, 49, 58, 55, 63, 60, 69, 66, 74, 72, 80, 78, 86, 84, 92];

export default function BentoMining({ className }) {
  return (
    <BentoCard className={className} eyebrow="Mobile mining" title="Mine from your phone"
      desc="No rigs, no electricity bills. Claim your share of each day's rewards in one tap — longer streaks earn more.">
      <div className="w-full rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Daily reward</p>
            <p className="font-heading text-2xl font-semibold leading-none">0.73 <span className="text-sm text-muted-foreground font-normal">BTG</span></p>
          </div>
          <span className="text-[11px] rounded-full bg-success/10 text-success px-2.5 py-1 font-medium">+46% streak bonus</span>
        </div>
        <div className="flex items-end gap-1.5 h-24">
          {bars.map((h, i) => (
            <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }}
              transition={{ delay: i * 0.035, duration: 0.5 }}
              className={`flex-1 rounded-t ${i === bars.length - 1 ? 'bg-gradient-gold' : 'bg-gold/20'}`} />
          ))}
        </div>
      </div>
    </BentoCard>
  );
}