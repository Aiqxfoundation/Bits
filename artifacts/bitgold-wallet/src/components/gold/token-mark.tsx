import { Brand } from '@/components/common';

/** Token mark for wallet rows: Bitgold coin for BTG, brand glyphs for display-only assets. */
export function TokenMark({ symbol, large = false }: { symbol: string; large?: boolean }) {
  const size = large ? 62 : 39;
  const code = symbol.toUpperCase();
  if (code === 'BTG') return <Brand size={size} />;
  const glyph = code === 'BTC' ? '₿' : code === 'USDT' ? '₮' : code.slice(0, 1);
  return <span className={`token-badge ${code.toLowerCase()} ${large ? 'token-badge-large' : ''}`} style={{ width: size, height: size }} aria-hidden="true">{glyph}</span>;
}
