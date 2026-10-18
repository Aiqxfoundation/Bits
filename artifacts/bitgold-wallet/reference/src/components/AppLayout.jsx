import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useOutletContext } from 'react-router-dom';
import { Pickaxe, Users, Wallet, User, BarChart3 } from 'lucide-react';
import Logo from './Logo';
import StatsSheet from './StatsSheet';
import { useProfile } from '@/hooks/useProfile';

const tabs = [
  { to: '/app', end: true, label: 'Mining', icon: Pickaxe },
  { to: '/app/team', label: 'Team', icon: Users },
  { to: '/app/wallet', label: 'Wallet', icon: Wallet },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const profileData = useProfile();
  const [statsOpen, setStatsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-md mx-auto relative">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate('/app')} className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-bold text-lg tracking-tight">Bitgold</span>
          </button>
          <button
            onClick={() => setStatsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 hover:bg-gold/15 transition-colors"
            aria-label="Network statistics"
          >
            <BarChart3 className="w-4 h-4 text-gold" />
            <span className="text-xs font-semibold text-gold">Stats</span>
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24 overflow-y-auto">
        <Outlet context={profileData} />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 backdrop-blur-xl bg-background/90 border-t border-border">
        <div className="grid grid-cols-4 h-16">
          {tabs.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors relative ${
                  isActive ? 'text-gold' : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 w-8 h-0.5 bg-gold rounded-full" />}
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      <StatsSheet open={statsOpen} onOpenChange={setStatsOpen} />
    </div>
  );
}

export function useAppData() {
  return useOutletContext();
}