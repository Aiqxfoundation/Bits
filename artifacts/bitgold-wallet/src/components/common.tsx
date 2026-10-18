import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Coins, Pickaxe } from 'lucide-react';

export function Brand({ size = 34 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-label="Bitgold">
      <span className="brand-mark__rim" />
      <span className="brand-mark__letters">B</span>
    </span>
  );
}

export function PageHeading({ eyebrow, title, description, aside }: {
  eyebrow?: string; title: string; description?: string; aside?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h1 className="heading-title">{title}</h1>
        {description && <p className="muted heading-description">{description}</p>}
      </div>
      {aside}
    </div>
  );
}

export function LoadingPanel({ label = 'Loading account data' }: { label?: string }) {
  return <div className="panel loading-panel" aria-label={label}>
    <div className="skeleton" style={{ height: 18, width: '38%' }} />
    <div className="skeleton" style={{ height: 38, width: '65%', marginTop: 17 }} />
    <div className="skeleton" style={{ height: 12, width: '82%', marginTop: 16 }} />
  </div>;
}

export function ErrorPanel({ message = 'We could not load this information.', onRetry }: { message?: string; onRetry?: () => void }) {
  return <div className="panel empty-panel">
    <div className="empty-symbol"><Coins size={21} /></div>
    <strong>Something interrupted the connection</strong>
    <p className="muted">{message}</p>
    {onRetry && <button className="button" onClick={onRetry} data-testid="button-retry">Try again</button>}
  </div>;
}

export function EmptyPanel({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="panel empty-panel">
    <div className="empty-symbol"><Pickaxe size={21} /></div>
    <strong>{title}</strong>
    <p className="muted">{detail}</p>
    {action}
  </div>;
}

export function InlineNotice({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'danger' | 'success' }) {
  return <div className={`notice notice-${tone}`}>{children}</div>;
}

export function Modal({ title, description, open, onClose, children }: {
  title: string; description?: string; open: boolean; onClose: () => void; children: ReactNode;
}) {
  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="dialog-card" role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-head">
        <div><h2>{title}</h2>{description && <p className="muted">{description}</p>}</div>
        <button className="icon-button" onClick={onClose} aria-label="Close dialog" data-testid="button-close-dialog">×</button>
      </header>
      {children}
    </section>
  </div>;
}

export function ButtonLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <Link href={href} className={`button ${className}`} data-testid={`link-${href.replaceAll('/', '-')}`}>
    {children}<ArrowRight size={15} />
  </Link>;
}

export function formatAmount(value: number, decimals = 4) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

export function apiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return fallback;
}

