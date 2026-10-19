import { Brand, formatAmount } from '@/components/common';

/** Compact mining rig card: coin mark, lifetime mined, hash power and cooldown progress. */
export function MiningRigCard({ totalMined, hashPower, progress, ready, countdown }: {
  totalMined: number; hashPower: number; progress: number; ready: boolean; countdown: string;
}) {
  return <section className="rig-card panel" data-testid="card-mining-rig">
    <div className="rig-top">
      <Brand size={48} />
      <div className="rig-main">
        <div className="eyebrow">MINING BTG</div>
        <div className="rig-amount mono">{formatAmount(totalMined, 4)} <span>BTG</span></div>
        <small className="muted">Mined to date on this account</small>
      </div>
      <div className="rig-hash">
        <div className="eyebrow">HASH</div>
        <div className="mono">{formatAmount(hashPower, 0)}<span>H/s</span></div>
      </div>
    </div>
    <div className="rig-progress" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
    <div className="rig-foot">
      <span className={`rig-status ${ready ? 'ready' : ''}`}><i className="status-dot" />{ready ? 'Ready to claim' : 'Mining in progress'}</span>
      <span className="rig-next">{ready ? 'Daily reward available' : <>Next claim in <b className="mono">{countdown}</b></>}</span>
    </div>
  </section>;
}
