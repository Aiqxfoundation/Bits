import { Gift } from 'lucide-react';
import { Sheet } from '@/components/sheet';

const STEPS = [
  { n: '1', body: <>Share your invite link. Members who join become your <b>Level 1</b> referrals.</> },
  { n: '2', body: <>Earn <i>10%</i> of the mining rewards your Level 1 referrals claim, credited automatically.</> },
  { n: '3', body: <>When they invite members of their own, your <b>Level 2</b> network pays <i>5%</i> of their claims.</> },
];

export function ReferralRewardsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Sheet open={open} onClose={onClose} title="How referral rewards work" description="Two levels of referral earnings">
    <div className="sheet-stack" data-testid="content-referral-rewards">
      {STEPS.map((step) => <div className="step-row" key={step.n}>
        <span className="step-index">{step.n}</span>
        <p className="muted">{step.body}</p>
      </div>)}
      <div className="step-row gift">
        <span className="sheet-row-icon"><Gift size={17} /></span>
        <p className="muted">Earnings are calculated from confirmed claims only and are credited by the Bitgold account service.</p>
      </div>
    </div>
  </Sheet>;
}
