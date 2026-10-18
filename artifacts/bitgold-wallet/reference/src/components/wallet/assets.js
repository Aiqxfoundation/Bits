// Shared wallet asset metadata + display rate.
export const BTG_USDT_RATE = 1;

export const ASSETS = [
  { kind: 'btg', symbol: 'BTG', name: 'Bitgold' },
  { kind: 'btc', symbol: 'BTC', name: 'Bitcoin' },
  { kind: 'usdt', symbol: 'USDT', name: 'Tether' },
];

export const getAsset = (sym) =>
  ASSETS.find((a) => a.symbol.toLowerCase() === String(sym || '').toLowerCase());