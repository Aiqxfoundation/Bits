// Chain logos sourced from the Trust Wallet assets repository
const TW = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';
const chains = [
  ['bitcoin', 'Bitcoin'], ['ethereum', 'Ethereum'], ['smartchain', 'BNB Chain'], ['solana', 'Solana'],
  ['polygon', 'Polygon'], ['arbitrum', 'Arbitrum'], ['base', 'Base'], ['avalanchec', 'Avalanche'],
  ['optimism', 'Optimism'], ['tron', 'TRON'], ['ton', 'TON'],
];

export default function ChainMarquee() {
  const row = [...chains, ...chains];
  return (
    <section id="network" className="border-y border-border/60 bg-card/30 py-10">
      <p className="text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-7 px-5">
        Designed to bridge the networks you already use
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee">
          {row.map(([slug, name], i) => (
            <div key={i} className="flex items-center gap-2.5 shrink-0 pr-12 opacity-75 hover:opacity-100 transition-opacity">
              <img src={`${TW}/${slug}/info/logo.png`} alt={name} className="w-7 h-7 rounded-full" loading="lazy" />
              <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}