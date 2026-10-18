import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading';

const steps = [
  { n: '01', title: 'Create your account', desc: 'Sign up in seconds with email or Google. Your mining profile is ready instantly.' },
  { n: '02', title: 'Claim every day', desc: 'Tap once every 24 hours to claim BTG. Keep your streak alive to grow each reward.' },
  { n: '03', title: 'Grow your network', desc: 'Share your invite link and earn a bonus on every claim your network makes.' },
];

export default function LandingSteps() {
  return (
    <section id="start" className="py-24 sm:py-32 px-5 border-t border-border/60">
      <div className="max-w-6xl mx-auto">
        <SectionHeading eyebrow="Get started" title="Three steps to your first block" />
        <div className="grid md:grid-cols-3 gap-10 md:gap-8">
          {steps.map((s, i) => (
            <motion.div key={s.n} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }} className="border-t border-border pt-6">
              <span className="font-display italic text-5xl text-gradient-gold">{s.n}</span>
              <h3 className="text-xl font-semibold tracking-tight mt-4 mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}