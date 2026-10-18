import { motion } from 'framer-motion';
import { Pickaxe, Users } from 'lucide-react';
import PhoneScreen from './PhoneScreen';

const toasts = [
  { icon: Pickaxe, title: 'Daily reward claimed', value: '+0.73 BTG', pos: '-top-6 -left-8 sm:top-20 sm:-left-14', delay: 0.7 },
  { icon: Users, title: 'Network bonus', value: '+0.07 BTG', pos: '-bottom-6 -right-8 sm:bottom-28 sm:-right-14', delay: 0.9 },
];

export default function HeroPhone() {
  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-[272px] sm:w-[300px]">
      <div className="absolute inset-x-6 -bottom-8 h-28 bg-gold/25 blur-3xl rounded-full" />
      <div className="relative rounded-[2.75rem] p-2.5 bg-gradient-to-b from-secondary to-card border border-border shadow-2xl">
        <div className="rounded-[2.25rem] overflow-hidden bg-background border border-border/60">
          <PhoneScreen />
        </div>
      </div>

      {toasts.map((t) => (
        <motion.div key={t.title} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: t.delay, duration: 0.5 }}
          className={`absolute ${t.pos} flex items-center gap-2.5 rounded-2xl border border-border bg-popover/90 backdrop-blur-xl px-3 py-2.5 shadow-xl`}>
          <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center">
            <t.icon className="w-4 h-4 text-gold" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground leading-none mb-1.5">{t.title}</p>
            <p className="text-sm font-semibold text-success leading-none">{t.value}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}