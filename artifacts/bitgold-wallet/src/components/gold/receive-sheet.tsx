import { useState } from 'react';
import { Check, Copy, Pickaxe, Users } from 'lucide-react';
import { Sheet } from '@/components/sheet';

/** Guidance panel: how BTG reaches a wallet (mining and referrals only). */
export function ReceiveSheet({ open, onClose, referralCode }: {
  open: boolean; onClose: () => void; referralCode?: string;
}) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const link = `${window.location.origin}/sign-up?ref=${referralCode ?? ''}`;
  const copy = async (value: string, key: 'code' | 'link') => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return <Sheet open={open} onClose={onClose} title="Receive BTG" description="BTG is earned through mining and referrals">
    <div className="sheet-stack" data-testid="content-receive-btg">
      <div className="receive-tiles">
        <article className="receive-tile gold">
          <Pickaxe size={18} />
          <strong>Mine daily</strong>
          <small>Claim once every 24 hours to grow your balance.</small>
        </article>
        <article className="receive-tile green">
          <Users size={18} />
          <strong>Build your team</strong>
          <small>Earn 10% L1 and 5% L2 on confirmed claims.</small>
        </article>
      </div>
      <div className="sheet-copy-row">
        <div>
          <span className="eyebrow">YOUR REFERRAL CODE</span>
          <strong className="mono">{referralCode ?? '—'}</strong>
        </div>
        <button className="icon-button" onClick={() => { void copy(referralCode ?? '', 'code'); }} aria-label="Copy referral code" data-testid="button-copy-receive-code" disabled={!referralCode}>
          {copied === 'code' ? <Check size={17} /> : <Copy size={17} />}
        </button>
      </div>
      <div className="sheet-copy-row">
        <div>
          <span className="eyebrow">YOUR INVITE LINK</span>
          <strong className="mono break-word">{link}</strong>
        </div>
        <button className="icon-button" onClick={() => { void copy(link, 'link'); }} aria-label="Copy invite link" data-testid="button-copy-receive-link">
          {copied === 'link' ? <Check size={17} /> : <Copy size={17} />}
        </button>
      </div>
      <p className="muted sheet-note">BTG is an internal ledger balance. Deposits and withdrawals are admin-reviewed requests.</p>
    </div>
  </Sheet>;
}
