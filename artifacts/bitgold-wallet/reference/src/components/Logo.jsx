import { Image } from '@/components/ui/image';

// Official Bitgold coin mark — high-resolution photorealistic gold coin.
const BTG_LOGO_URL =
  'https://media.base44.com/images/public/6aca7b9282a5f7ab0a33b638/538ec0a1d_file_00000000c5a88211b33664d877025c47.png';

export default function Logo({ size = 40, className = '', glow = false }) {
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        overflow: 'hidden',
        position: 'relative',
        display: 'inline-block',
        flexShrink: 0,
        filter: glow ? `drop-shadow(0 0 ${size * 0.12}px hsl(43 70% 56% / 0.45))` : undefined,
      }}
    >
      {/* Source has ~10% transparent padding; enlarge the image box so the coin fills the circle
          edge-to-edge while still being fetched at full resolution for the zoomed size. */}
      <Image
        src={BTG_LOGO_URL}
        fittingType="fill"
        quality={100}
        className="absolute"
        style={{ width: '125%', height: '125%', left: '-12.25%', top: '-9.75%' }}
        alt="Bitgold"
      />
    </span>
  );
}