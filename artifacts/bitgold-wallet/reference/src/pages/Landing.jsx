import { useNavigate } from 'react-router-dom';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import ChainMarquee from '@/components/landing/ChainMarquee';
import LandingBento from '@/components/landing/LandingBento';
import LandingSteps from '@/components/landing/LandingSteps';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Landing() {
  const navigate = useNavigate();
  const enter = () => navigate('/app');

  // Preserve referral code from URL if present
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    try { localStorage.setItem('btg_referral_code', ref.toUpperCase()); } catch (e) {}
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <LandingNav onEnter={enter} />
      <LandingHero onEnter={enter} />
      <ChainMarquee />
      <LandingBento />
      <LandingSteps />
      <LandingFooter />
    </div>
  );
}