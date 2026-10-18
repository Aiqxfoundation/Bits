import { motion } from 'framer-motion';

export default function BentoCard({ eyebrow, title, desc, children, className = '' }) {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-3xl border border-border bg-card-gradient p-6 sm:p-8 flex flex-col hover:border-gold/25 transition-colors ${className}`}
    >
      <div className="max-w-md">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{eyebrow}</p>
        <h3 className="text-2xl font-semibold tracking-tight mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <div className="mt-8 flex-1 flex items-end">{children}</div>
    </motion.div>
  );
}