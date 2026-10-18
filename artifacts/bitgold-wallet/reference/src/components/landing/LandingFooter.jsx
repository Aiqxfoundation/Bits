import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const cols = [
  { title: 'Protocol', links: [{ label: 'Goldpaper', to: '/goldpaper' }, { label: 'Features', href: '#protocol' }, { label: 'Get started', href: '#start' }] },
  { title: 'App', links: [{ label: 'Mining', to: '/app' }, { label: 'Team', to: '/app/team' }, { label: 'Wallet', to: '/app/wallet' }] },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/60 px-5 pt-14 pb-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size={28} />
              <span className="font-heading font-semibold text-lg tracking-tight">Bitgold</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">The gold standard for digital payments.</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4">{c.title}</p>
              <ul className="space-y-2.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.to
                      ? <Link to={l.to} className="text-foreground/80 hover:text-gold transition-colors">{l.label}</Link>
                      : <a href={l.href} className="text-foreground/80 hover:text-gold transition-colors">{l.label}</a>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row gap-2 justify-between text-xs text-muted-foreground">
          <p>© 2026 Bitgold Network</p>
          <p className="text-muted-foreground/70">Digital assets involve risk. Nothing on this site is financial advice.</p>
        </div>
      </div>
    </footer>
  );
}