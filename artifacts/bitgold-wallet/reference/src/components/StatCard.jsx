import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div className={`rounded-2xl p-4 border ${accent ? 'border-gold/30 bg-gradient-to-br from-gold/10 to-transparent' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
        {Icon && <Icon className={`w-3.5 h-3.5 ${accent ? 'text-gold' : ''}`} />}
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-bold tabular-nums ${accent ? 'text-gold' : 'text-foreground'}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}