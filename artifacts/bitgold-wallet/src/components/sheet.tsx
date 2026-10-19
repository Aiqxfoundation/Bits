import type { ReactNode } from 'react';

/** Bottom sheet used for the ported Bitgold panels. Presentation only. */
export function Sheet({ open, onClose, title, description, children }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode;
}) {
  if (!open) return null;
  return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="sheet-card" role="dialog" aria-modal="true" aria-label={title}>
      <span className="sheet-grip" aria-hidden="true" />
      <header className="sheet-head">
        <div>
          <h2>{title}</h2>
          {description && <p className="muted">{description}</p>}
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close panel" data-testid="button-close-sheet">×</button>
      </header>
      {children}
    </section>
  </div>;
}

/** Icon tile + label + value row, as used across the ported info sheets. */
export function SheetRow({ icon, label, value, sub }: {
  icon: ReactNode; label: string; value: ReactNode; sub?: string;
}) {
  return <div className="sheet-row">
    <span className="sheet-row-icon">{icon}</span>
    <div className="sheet-row-main">
      <span>{label}</span>
      <strong className="mono">{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  </div>;
}
