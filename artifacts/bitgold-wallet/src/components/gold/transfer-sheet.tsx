import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine } from 'lucide-react';
import { Sheet } from '@/components/sheet';
import { formatAmount } from '@/components/common';

/** Guidance panel: peer transfer is not part of this account model yet. */
export function TransferSheet({ open, onClose, available }: {
  open: boolean; onClose: () => void; available: number;
}) {
  return <Sheet open={open} onClose={onClose} title="Transfer BTG" description="Peer transfers are not enabled in this interface">
    <div className="sheet-stack" data-testid="content-transfer-btg">
      <div className="transfer-art"><ArrowLeftRight size={22} /></div>
      <div className="sheet-copy-row balance">
        <div>
          <span className="eyebrow">AVAILABLE BALANCE</span>
          <strong className="mono">{formatAmount(available, 4)} BTG</strong>
        </div>
      </div>
      <p className="muted sheet-note">Transfers to other members are not available yet. Move funds through an administrator-reviewed request:</p>
      <div className="receive-tiles">
        <article className="receive-tile gold">
          <ArrowDownToLine size={18} />
          <strong>Request deposit</strong>
          <small>Logged against your account and reviewed by an administrator.</small>
        </article>
        <article className="receive-tile">
          <ArrowUpFromLine size={18} />
          <strong>Request withdrawal</strong>
          <small>Sent to a destination address after approval.</small>
        </article>
      </div>
    </div>
  </Sheet>;
}
