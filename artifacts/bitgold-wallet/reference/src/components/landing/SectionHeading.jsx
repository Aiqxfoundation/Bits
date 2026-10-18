export default function SectionHeading({ eyebrow, title, desc }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold mb-4">{eyebrow}</p>
      <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]">{title}</h2>
      {desc && <p className="text-muted-foreground text-base sm:text-lg mt-5 leading-relaxed">{desc}</p>}
    </div>
  );
}