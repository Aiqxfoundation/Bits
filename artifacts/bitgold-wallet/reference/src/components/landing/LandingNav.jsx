import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';

const links = [
  { label: 'Protocol', href: '#protocol' },
  { label: 'Network', href: '#network' },
  { label: 'Get started', href: '#start' },
];

export default function LandingNav({ onEnter }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="font-heading font-semibold text-lg tracking-tight">Bitgold</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">{l.label}</a>
          ))}
          <Link to="/goldpaper" className="hover:text-foreground transition-colors">Goldpaper</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/goldpaper" className="md:hidden text-sm text-muted-foreground hover:text-foreground transition-colors">Goldpaper</Link>
          <Button onClick={onEnter} className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold px-5 h-9">
            Launch App
          </Button>
        </div>
      </div>
    </header>
  );
}