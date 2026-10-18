import { motion } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import SectionHeading from './SectionHeading';

// Fair-launch model inspired by Bitcoin: 65% to community & mining (majority),
// with network infrastructure, liquidity, and a vested team allocation.
const distribution = [
  { label: 'App mining', pct: 35, color: 'hsl(45 85% 72%)' },
  { label: 'Node mainnet mining', pct: 20, color: 'hsl(43 70% 56%)' },
  { label: 'Community & ecosystem', pct: 10, color: 'hsl(43 60% 48%)' },
  { label: 'Staking & validators', pct: 12, color: 'hsl(40 50% 40%)' },
  { label: 'Exchange liquidity', pct: 12, color: 'hsl(36 45% 34%)' },
  { label: 'Team & advisors (vested)', pct: 8, color: 'hsl(34 35% 28%)' },
  { label: 'Grants & infrastructure', pct: 3, color: 'hsl(30 20% 38%)' },
];

const metrics = [
  { value: '21M', label: 'Fixed max supply' },
  { value: '0', label: 'Future minting' },
  { value: '65%', label: 'Community & mining' },
  { value: '4yr', label: 'Team vesting' },
];

export default function LandingTokenomics() {
  return (
    <section id="tokenomics" className="relative scroll-mt-28 py-24 sm:py-32 px-5 border-t border-border/60">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="Tokenomics"
          title={<>Bitcoin-standard <span className="font-display italic font-normal text-gradient-gold">economics</span></>}
          desc="A fair-launch model inspired by Bitcoin — 65% allocated to community and mining, no premine, no future minting. Team tokens vested over four years."
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-border bg-card-gradient p-5 text-center">
              <div className="font-heading text-3xl font-semibold text-gradient-gold">{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1.5">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card-gradient p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="pct" innerRadius={58} outerRadius={82} paddingAngle={1} stroke="none">
                    {distribution.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-heading text-2xl font-semibold">21M</span>
                <span className="text-[11px] text-muted-foreground">BTG</span>
              </div>
            </div>
            <div className="flex-1 w-full space-y-3">
              {distribution.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-sm text-foreground/80 flex-1">{d.label}</span>
                    <span className="text-sm font-semibold tabular-nums">{d.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden ml-[18px]">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${d.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                      className="h-full rounded-full" style={{ background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}