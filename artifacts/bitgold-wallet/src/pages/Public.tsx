import { Link } from 'wouter';
import { ArrowRight, Coins, LockKeyhole, Pickaxe, ShieldCheck, Users, Zap } from 'lucide-react';
import { useGetPlatformStats } from '@workspace/api-client-react';
import { getGetPlatformStatsQueryKey } from '@workspace/api-client-react';
import { Brand, formatAmount } from '@/components/common';

function Header({ active }: { active?: string }) {
  return <header className="public-header">
    <Link href="/" className="brand-link"><Brand size={34} /><strong>Bitgold</strong></Link>
    <nav className="public-nav">
      <a href="/#protocol">Protocol</a>
      <a href="/#network">Network</a>
      <Link href="/goldpaper">Goldpaper</Link>
    </nav>
    <div className="public-actions">
      <Link className="public-login" href="/sign-in">Sign in</Link>
      <Link className="button gold" href="/sign-up">{active || 'Launch app'} <ArrowRight size={15} /></Link>
    </div>
  </header>;
}

export function Landing() {
  const { data: stats, isLoading, isError, refetch } = useGetPlatformStats({
    query: { queryKey: getGetPlatformStatsQueryKey(), staleTime: 30_000 },
  });
  const referral = new URLSearchParams(window.location.search).get('ref');
  const signupHref = referral ? `/sign-up?ref=${encodeURIComponent(referral)}` : '/sign-up';
  return <div className="public-page">
    <Header active="Create account" />
    <section className="landing-hero">
      <div className="hero-grid" />
      <div className="hero-copy animate-enter">
        <div className="hero-kicker"><span className="live-dot" /> Mining phase is open <ArrowRight size={13} /></div>
        <h1>The <em>gold standard</em><br />for digital payments.</h1>
        <p>Bitgold is a fixed-supply token distributed through daily mining and referrals. Earn BTG from your phone and help shape a network built for payments.</p>
        <div className="hero-actions">
          <Link className="button gold button-large" href={signupHref}>Start mining <ArrowRight size={16} /></Link>
          <Link className="button button-large button-quiet" href="/goldpaper">Read the Goldpaper</Link>
        </div>
        <div className="hero-caption"><span className="caption-line" /> A community-led token distribution</div>
      </div>
      <div className="hero-visual animate-enter animate-delay-2">
        <div className="orbit orbit-one" /><div className="orbit orbit-two" />
        <div className="hero-coin"><div className="coin-rim"><span>B</span></div><div className="coin-star">✦</div></div>
        <div className="float-tag tag-reward"><div className="tag-icon"><Pickaxe size={16} /></div><div><small>Daily reward</small><strong>BTG mining</strong></div></div>
        <div className="float-tag tag-network"><div className="tag-icon dark"><Users size={16} /></div><div><small>Referral network</small><strong>Two reward levels</strong></div></div>
        <div className="visual-caption">SCARCITY · PARTICIPATION · PAYMENTS</div>
      </div>
    </section>

    <section className="ticker-strip" aria-label="Network statistics">
      <div className="ticker-lead"><span className="ticker-dot" /> NETWORK AT A GLANCE</div>
      {isLoading ? <span className="muted">Loading platform metrics…</span> : isError ? <button className="text-button" onClick={() => refetch()}>Network metrics unavailable · retry</button> : <>
        <span><small>COMMUNITY</small>{stats?.totalUsers.toLocaleString() ?? '—'} <i>miners</i></span>
        <span><small>BTG DISTRIBUTED</small>{formatAmount(stats?.totalMined ?? 0, 2)} <i>BTG</i></span>
        <span><small>CLAIMS COMPLETED</small>{stats?.totalClaims.toLocaleString() ?? '—'} <i>claims</i></span>
      </>}
    </section>

    <section id="protocol" className="section-block">
      <div className="section-intro">
        <div className="eyebrow">A different kind of digital asset</div>
        <h2>Value comes from<br /><em>showing up.</em></h2>
        <p>Bitgold begins with a simple promise: a transparent supply, open participation, and rewards earned by the people who grow the network.</p>
        <Link className="inline-link" href="/goldpaper">Explore the protocol <ArrowRight size={15} /></Link>
      </div>
      <div className="feature-stack">
        <article className="feature-panel feature-wide">
          <div className="feature-index">01 / PARTICIPATE</div><div className="feature-icon"><Pickaxe size={20} /></div>
          <h3>Mine from the rhythm of a day.</h3><p>Return once every 24 hours to claim your reward. No hardware, no electricity race—just a steady signal of participation.</p>
          <div className="feature-foot"><span>Daily cadence</span><span>01</span></div>
        </article>
        <article className="feature-panel feature-small">
          <div className="feature-index">02 / SHARE</div><div className="feature-icon green"><Users size={20} /></div>
          <h3>Build a network that rewards.</h3><p>Invite people into the network. Earn a share of mining activity across two levels.</p>
          <div className="feature-foot"><span>10% direct · 5% indirect</span><span>02</span></div>
        </article>
        <article className="feature-panel feature-small feature-alt">
          <div className="feature-index">03 / HOLD</div><div className="feature-icon dim"><ShieldCheck size={20} /></div>
          <h3>Scarcity you can count.</h3><p>BTG follows a fixed 21 million supply cap. Distribution is designed around community mining.</p>
          <div className="feature-foot"><span>Fixed supply: 21M BTG</span><span>03</span></div>
        </article>
      </div>
    </section>

    <section className="network-band" id="network">
      <div className="network-band-copy">
        <div className="eyebrow">Participation compounds</div>
        <h2>One claim.<br /><em>More connection.</em></h2>
        <p>Every claim strengthens the distribution. Every invitation gives another person a place to begin.</p>
        <Link className="button gold" href={signupHref}>Join the network <ArrowRight size={15} /></Link>
      </div>
      <div className="network-map">
        <div className="map-ring map-ring-a" /><div className="map-ring map-ring-b" /><div className="map-core"><Brand size={60} /></div>
        <div className="map-node node-a"><span /><i>Miner 01</i></div><div className="map-node node-b"><span /><i>Miner 02</i></div><div className="map-node node-c"><span /><i>Miner 03</i></div><div className="map-node node-d"><span /><i>Miner 04</i></div>
        <div className="map-line line-a" /><div className="map-line line-b" /><div className="map-line line-c" /><div className="map-line line-d" />
      </div>
    </section>

    <section className="steps-section" id="start">
      <div className="eyebrow">A clear first step</div><h2>From account to <em>first claim.</em></h2>
      <div className="steps-list">
        <article><span>01</span><div><h3>Create a Bitgold account</h3><p>Choose a username. Your secure account key is generated for you and shown once.</p></div><LockKeyhole size={20} /></article>
        <article><span>02</span><div><h3>Come back each day</h3><p>Open the Mining screen to claim a reward when your 24-hour window is ready.</p></div><Zap size={20} /></article>
        <article><span>03</span><div><h3>Invite your people</h3><p>Share your referral link and grow a two-level network alongside your mining activity.</p></div><Users size={20} /></article>
      </div>
    </section>

    <section className="join-banner">
      <div><div className="eyebrow">The network is open</div><h2>Make your first claim count.</h2><p>Start building your place in Bitgold.</p></div>
      <Link className="button gold button-large" href={signupHref}>Create account <ArrowRight size={16} /></Link>
    </section>
    <PublicFooter />
  </div>;
}

export function Goldpaper() {
  return <div className="public-page">
    <Header active="Launch app" />
    <section className="paper-hero">
      <div className="eyebrow">BITGOLD · PROTOCOL NOTES 01</div>
      <h1>A payment network<br />anchored by <em>scarcity.</em></h1>
      <p>The economic and participation design behind Bitgold: a fixed-supply token distributed through community mining.</p>
      <div className="paper-meta"><span>THE GOLDPAPER</span><span>REVISION 1.0</span><span>2026</span></div>
    </section>
    <div className="paper-layout">
      <aside className="paper-toc"><span className="eyebrow">On this page</span><a href="#design">01 · Design principles</a><a href="#mechanics">02 · Mining mechanics</a><a href="#economics">03 · Token economics</a><a href="#roadmap">04 · Roadmap</a><Link href="/">Return to Bitgold</Link></aside>
      <div className="paper-content">
        <section id="design"><div className="paper-number">01</div><h2>Design principles</h2><p className="lead">Bitgold is a signed-in token and mining experience today, not a live-chain wallet. Its current distribution centers on transparent server-managed balances, timed claims, and referral participation.</p><div className="principles">
          <article><Pickaxe size={21} /><h3>Open participation</h3><p>Mining claims are available to members on a daily cadence. The experience is designed for broad access without specialist hardware.</p></article>
          <article><ShieldCheck size={21} /><h3>Fixed supply intent</h3><p>The planned maximum supply is 21,000,000 BTG. Supply and reward policy must be administered transparently as the network evolves.</p></article>
          <article><Coins size={21} /><h3>Payment utility</h3><p>BTG is intended as a payment asset for a future network. Wallet deposits and withdrawals here are requests pending administrator review.</p></article>
        </div></section>
        <section id="mechanics"><div className="paper-number">02</div><h2>Mining mechanics</h2><p>Account holders can claim a reward after the daily claim interval. A successful claim is recorded to the account ledger; the server remains authoritative for availability, timing, streaks, and reward amounts.</p><div className="paper-callout"><strong>One account. One active device.</strong><p>Bitgold uses a single-active-device rule. If a sign-in is detected from another device, the user must explicitly confirm switching the active session.</p></div><h3>Referral participation</h3><p>The team program is organized into two levels: 10% from direct referrals and 5% from second-level referrals. All credits are reflected in the server ledger.</p></section>
        <section id="economics"><div className="paper-number">03</div><h2>Token economics</h2><div className="supply-ledger"><div><small>MAXIMUM SUPPLY</small><strong>21,000,000 <i>BTG</i></strong></div><div><small>DISTRIBUTION MODEL</small><strong>Mining + referrals</strong></div><div><small>WALLET MODEL</small><strong>Internal ledger</strong></div></div><p>The product represents a managed token balance and should not be mistaken for a live-chain account, custody service, or guarantee of market value. Transfers are not available in this interface.</p></section>
        <section id="roadmap"><div className="paper-number">04</div><h2>Roadmap</h2><div className="roadmap-list"><article><span>NOW</span><div><h3>Community mining</h3><p>Daily claims, account profiles, team referrals, and admin-reviewed wallet requests.</p></div><span className="status active">In progress</span></article><article><span>NEXT</span><div><h3>Operational readiness</h3><p>Harden account controls, review workflows, and transparent supply reporting.</p></div><span className="status">Planned</span></article><article><span>FUTURE</span><div><h3>Payment network exploration</h3><p>Evaluate multichain and mainnet options only when governance, custody, and security are ready.</p></div><span className="status">Research</span></article></div></section>
      </div>
    </div>
    <PublicFooter />
  </div>;
}

export function Privacy() {
  return <div className="public-page"><Header active="Create account" /><main className="privacy-page">
    <div className="eyebrow">BITGOLD · PRIVACY</div><h1>Privacy, clearly stated.</h1><p className="lead">Bitgold collects limited account and device information to operate the mining experience and protect account access.</p>
    <section><h2>Public IP address</h2><p>When you use Bitgold, the service may collect your public IP address and related session timing to support account security and operational review. A public IP can be shared by multiple people on the same home, office, school, carrier, or VPN network.</p><p>Shared-IP groups are shown only to authorized administrators as review signals. A shared IP is not, by itself, a finding of fraud and does not automatically trigger a ban.</p></section>
    <section><h2>One active device</h2><p>Each account permits one active device session at a time. Signing in from a new device may ask you to confirm a session switch; confirming moves the active session to the new device.</p></section>
    <section><h2>Account key</h2><p>Your account key is a randomly generated high-entropy password credential managed by Clerk. It is shown at signup and during a rotation moment only. Bitgold does not send the key to its application API or store it in the wallet ledger.</p></section>
    <section><h2>Ledger and wallet requests</h2><p>Balances, mining activity, referrals, deposits, and withdrawals are server-managed account records. Deposit and withdrawal requests remain pending until an administrator confirms or rejects them.</p></section>
    <Link className="inline-link" href="/">Back to Bitgold <ArrowRight size={15} /></Link>
  </main><PublicFooter /></div>;
}

function PublicFooter() {
  return <footer className="public-footer"><Link href="/" className="brand-link"><Brand size={27} /><strong>Bitgold</strong></Link><span>BTG · A community mining network</span><div><Link href="/goldpaper">Goldpaper</Link><Link href="/privacy">Privacy</Link><Link href="/sign-in">Sign in</Link></div><small>Balances are internal ledger values. Bitgold is not a live-chain wallet.</small></footer>;
}

