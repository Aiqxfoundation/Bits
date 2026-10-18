import Logo from '@/components/Logo';
import { Image } from '@/components/ui/image';

const BTC_LOGO_URL =
  'https://media.base44.com/images/public/6aca7b9282a5f7ab0a33b638/779711b44_Bitcoinsvg.png';

// Official-style token icons. BTG uses the app coin mark; BTC uses the official
// Bitcoin logo; USDT uses a brand-colored glyph.
export default function TokenIcon({ kind, size = 40 }) {
  if (kind === 'btg') return <Logo size={size} />;

  if (kind === 'btc') {
    return (
      <span
        style={{ width: size, height: size, borderRadius: '9999px', overflow: 'hidden', display: 'inline-block', flexShrink: 0 }}
      >
        <Image src={BTC_LOGO_URL} fittingType="fill" className="w-full h-full" alt="Bitcoin" />
      </span>
    );
  }

  if (kind === 'usdt') {
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} aria-label="Tether">
        <circle cx="20" cy="20" r="20" fill="#26A17B" />
        <path
          d="M22.5 17.3v-2.1h4.8v-3.2H12.7v3.2h4.8v2.1c-3.9.18-6.84.95-6.84 1.87s2.94 1.69 6.84 1.87v6.74h4.9v-6.74c3.9-.18 6.83-.95 6.83-1.87s-2.93-1.69-6.83-1.87zm0 3.17v-.01c-.1.01-.62.04-1.78.04h-.01c-1.5 0-2.53-.03-2.53-.03v.01c-3.18-.14-5.55-.7-5.55-1.36 0-.66 2.37-1.21 5.55-1.35v2.16c.1.01 1.06.06 2.55.06 1.1 0 1.66-.04 1.78-.06v-2.16c3.17.14 5.54.7 5.54 1.35 0 .65-2.37 1.21-5.55 1.35z"
          fill="#fff"
        />
      </svg>
    );
  }

  return null;
}