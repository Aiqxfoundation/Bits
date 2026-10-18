import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownLeft, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpFromLine, Check, ChevronRight, Copy,
  Eye, EyeOff, FileClock, Fingerprint, Gift, KeyRound, LayoutDashboard, LogOut, Pickaxe, Settings2, ShieldCheck, Share2, TrendingUp, Users, Wallet as WalletIcon, Zap,
} from 'lucide-react';
import {
  getGetAccountQueryKey, getGetDashboardQueryKey, getGetPlatformStatsQueryKey, getGetTeamQueryKey, getGetWalletQueryKey,
  useClaimMining, useGetAccount, useGetDashboard, useGetPlatformStats, useGetTeam, useGetWallet, useRequestDeposit,
  useRequestWithdrawal, useUpdateProfile,
} from '@workspace/api-client-react';
import type { WalletAsset, WalletTransaction } from '@workspace/api-client-react';
import { Brand, EmptyPanel, ErrorPanel, InlineNotice, LoadingPanel, Modal, PageHeading, apiErrorMessage, formatAmount, formatDate } from '@/components/common';

const adminNav = [
  { href: '/app/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/app/admin/users', label: 'Users', icon: Users },
  { href: '/app/admin/deposits', label: 'Deposits', icon: ArrowDownToLine },
  { href: '/app/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
  { href: '/app/admin/risk', label: 'IP review', icon: Fingerprint },
  { href: '/app/admin/audit', label: 'Audit log', icon: FileClock },
];

function AccountInitial({ name }: { name: string }) {
  return <span className="account-initial">{name.slice(0, 1).toUpperCase()}</span>;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { signOut } = useAuth();
  const accountQuery = useGetAccount({ query: { queryKey: getGetAccountQueryKey(), staleTime: 20_000 } });
  const account = accountQuery.data;
  const admin = account?.role === 'admin';
  const nav = [
    { href: '/app', label: 'Mining', icon: Pickaxe },
    { href: '/app/team', label: 'Team', icon: Users },
    { href: '/app/wallet', label: 'Wallet', icon: WalletIcon },
    { href: '/app/profile', label: 'Profile', icon: Settings2 },
  ];

  if (accountQuery.isLoading) return <div className="app-frame"><div className="topbar"><Brand /><span className="skeleton" style={{ width: 100, height: 16 }} /></div><main className="app-main"><LoadingPanel /></main></div>;
  if (accountQuery.isError || !account) return <div className="app-frame"><div className="topbar"><Link href="/app" className="brand-link"><Brand size={30} /><strong>Bitgold</strong></Link></div><main className="app-main"><ErrorPanel message="Your account details could not be retrieved. The app does not keep a local copy of account or balance data." onRetry={() => accountQuery.refetch()} /><div style={{ marginTop: 16 }}><button className="button" onClick={() => { void signOut(); }}><LogOut size={15} /> Sign out</button></div></main></div>;
  if (account.status === 'banned') return <div className="app-frame"><div className="topbar"><Link href="/" className="brand-link"><Brand size={30} /><strong>Bitgold</strong></Link></div><main className="app-main"><section className="panel suspended-panel"><ShieldCheck size={28} /><div className="eyebrow">ACCOUNT STATUS</div><h1>Access is restricted.</h1><p className="muted">This account is currently restricted. If you believe this is a mistake, contact Bitgold support for a review.</p><button className="button" onClick={() => { void signOut(); }}><LogOut size={15} /> Sign out</button></section></main></div>;

  return <div className="app-frame">
    <aside className="desktop-sidebar">
      <Link href="/app" className="brand-link sidebar-brand"><Brand size={32} /><strong>Bitgold</strong></Link>
      <div className="sidebar-user"><AccountInitial name={account.displayName || account.username} /><div><strong>{account.displayName || account.username}</strong><span>{admin ? 'Administrator' : 'Member'}</span></div></div>
      <div className="eyebrow sidebar-label">YOUR ACCOUNT</div>
      {nav.map((item) => <Link key={item.href} href={item.href} className={`sidebar-link ${location === item.href || (item.href === '/app/wallet' && location.startsWith('/app/wallet/')) ? 'active' : ''}`} data-testid={`link-sidebar-${item.label.toLowerCase()}`}><item.icon size={17} />{item.label}</Link>)}
      {admin && <>
        <div className="eyebrow sidebar-label">ADMIN CONSOLE</div>
        {adminNav.map((item) => <Link key={item.href} href={item.href} className={`sidebar-link ${location === item.href ? 'active' : ''}`} data-testid={`link-admin-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={17} />{item.label}</Link>)}
      </>}
      <div className="sidebar-bottom"><Link href="/privacy" className="sidebar-link"><ShieldCheck size={16} />Privacy & security</Link><button className="sidebar-link" onClick={() => { void signOut(); }}><LogOut size={16} />Sign out</button></div>
    </aside>
    <header className="topbar">
      <Link href="/app" className="brand-link mobile-brand"><Brand size={29} /><strong>Bitgold</strong></Link>
      <div className="topbar-actions">
        <Link href="/privacy" className="topbar-security"><ShieldCheck size={15} /><span>Protected account</span></Link>
        <Link href="/app/profile" className="topbar-avatar" title="Profile"><AccountInitial name={account.displayName || account.username} /></Link>
      </div>
    </header>
    <main className="app-main">{children}</main>
    <nav className={`bottom-nav ${admin ? 'admin-mode' : ''}`}>
      {nav.map((item) => <Link key={item.href} href={item.href} className={`nav-item ${location === item.href || (item.href === '/app/wallet' && location.startsWith('/app/wallet/')) ? 'active' : ''}`} data-testid={`link-mobile-${item.label.toLowerCase()}`}><item.icon size={19} /><span>{item.label}</span></Link>)}
      {admin && <Link href="/app/admin" className={`nav-item ${location.startsWith('/app/admin') ? 'active' : ''}`} data-testid="link-mobile-admin"><ShieldCheck size={19} /><span>Admin</span></Link>}
    </nav>
  </div>;
}

export function DashboardPage() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const queryClient = useQueryClient();
  const dashboard = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey(), refetchOnWindowFocus: true } });
  const platform = useGetPlatformStats({ query: { queryKey: getGetPlatformStatsQueryKey(), staleTime: 30_000 } });
  const claim = useClaimMining({
    mutation: { onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAccountQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() }),
      ]);
    } },
  });
  const data = dashboard.data;
  if (dashboard.isLoading) return <LoadingPanel label="Loading mining dashboard" />;
  if (dashboard.isError || !data) return <ErrorPanel message="Mining data is temporarily unavailable." onRetry={() => dashboard.refetch()} />;
  const lastClaim = data.account.lastClaimDate ? new Date(data.account.lastClaimDate).getTime() : 0;
  const nextClaim = lastClaim + 86_400_000;
  const ready = !lastClaim || now >= nextClaim;
  const seconds = Math.max(0, Math.floor((nextClaim - now) / 1000));
  const time = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60];
  return <div className="screen-stack">
    <PageHeading eyebrow="YOUR DAILY RHYTHM" title="Mining" description={`Welcome back, ${data.account.displayName || data.account.username}.`} aside={<span className="status active"><span className="status-dot" /> Account active</span>} />
    <section className="mining-stage panel">
      <div className="stage-header"><div className="eyebrow">BITGOLD MINING RIG</div><div className="stage-tag"><span className="live-dot" /> NETWORK ACTIVE</div></div>
      <div className="mining-orb"><div className="mining-orb-ring ring-1" /><div className="mining-orb-ring ring-2" /><div className="mining-orb-ring ring-3" /><div className="mining-core"><span className="core-b">B</span><span className="core-label">BTG</span></div><div className="orb-particle particle-1" /><div className="orb-particle particle-2" /><div className="orb-particle particle-3" /></div>
      <div className="stage-balance"><div className="eyebrow">AVAILABLE BALANCE</div><div className="balance-large">{formatAmount(data.account.availableBalance)} <span>BTG</span></div><div className="stage-sub">+ {formatAmount(data.account.pendingBalance)} pending</div></div>
      <div className="stage-foot"><div><Zap size={15} /><span><b>{formatAmount(data.account.hashPower, 0)}</b> hash power</span></div><div><TrendingUp size={15} /><span><b>{data.account.streak}</b> day streak</span></div><div><Gift size={15} /><span><b>{data.account.totalClaims}</b> total claims</span></div></div>
    </section>
    <div className="claim-area">
      {ready ? <button className="button gold claim-button" disabled={claim.isPending} onClick={() => claim.mutate()} data-testid="button-claim-mining">
        <Pickaxe size={19} /> {claim.isPending ? 'Claiming reward…' : 'Claim your BTG'}
      </button> : <div className="claim-countdown panel"><div className="eyebrow">NEXT CLAIM IN</div><div className="countdown-numbers">{time.map((value, index) => <span key={index}><b>{String(value).padStart(2, '0')}</b><i>{['HRS', 'MIN', 'SEC'][index]}</i>{index < 2 && <em>:</em>}</span>)}</div><div className="progress-line"><span style={{ width: `${Math.min(100, Math.max(0, ((now - lastClaim) / 86_400_000) * 100))}%` }} /></div></div>}
      {claim.isError && <InlineNotice tone="danger">{apiErrorMessage(claim.error, 'Your reward could not be claimed. Try again shortly.')}</InlineNotice>}
      {claim.isSuccess && <InlineNotice tone="success">Mining reward recorded: +{formatAmount(claim.data.amount)} BTG. Your updated balance is shown above.</InlineNotice>}
      <p className="claim-disclaimer">Rewards and timing are confirmed by the Bitgold account service.</p>
    </div>
    <section className="referral-promo panel"><div className="promo-icon"><Users size={20} /></div><div><h3>Build your mining team.</h3><p>Earn 10% from direct referrals and 5% from their network activity.</p><Link href="/app/team" className="inline-link">View your team <ArrowRight size={14} /></Link></div></section>
    <section className="metrics-row">
      <article><span className="eyebrow">TOTAL MINED</span><strong>{formatAmount(data.account.totalMined, 3)} <i>BTG</i></strong></article>
      <article><span className="eyebrow">REFERRAL EARNINGS</span><strong>{formatAmount(data.account.totalReferralEarnings, 3)} <i>BTG</i></strong></article>
      <article><span className="eyebrow">NETWORK MEMBERS</span><strong>{platform.data?.totalUsers.toLocaleString() ?? '—'} <i>miners</i></strong></article>
    </section>
    <section className="transaction-section"><div className="section-row-head"><div><div className="eyebrow">ACCOUNT HISTORY</div><h2>Recent activity</h2></div><Link href="/app/wallet" className="inline-link">Wallet <ArrowRight size={14} /></Link></div>
      <TransactionList transactions={data.recentTransactions.slice(0, 5)} />
    </section>
  </div>;
}

export function TeamPage() {
  const teamQuery = useGetTeam({ query: { queryKey: getGetTeamQueryKey() } });
  const [copied, setCopied] = useState(false);
  const data = teamQuery.data;
  const link = `${window.location.origin}/?ref=${data?.referralCode ?? ''}`;
  const copy = async () => { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 1700); };
  const share = async () => {
    if (navigator.share) await navigator.share({ title: 'Bitgold · BTG mining', text: 'Join my Bitgold network.', url: link });
    else await copy();
  };
  if (teamQuery.isLoading) return <LoadingPanel label="Loading team" />;
  if (teamQuery.isError || !data) return <ErrorPanel message="Your referral network is temporarily unavailable." onRetry={() => teamQuery.refetch()} />;
  return <div className="screen-stack">
    <PageHeading eyebrow="GROW YOUR NETWORK" title="Team" description="A two-level referral network, with rewards tied to participation." />
    <section className="referral-link-panel panel"><div><div className="eyebrow">YOUR INVITE LINK</div><div className="invite-code">{data.referralCode}</div><span className="muted invite-url">{link}</span></div><div className="invite-actions"><button className="button gold" onClick={copy} data-testid="button-copy-referral">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy link'}</button><button className="button" onClick={share} data-testid="button-share-referral"><Share2 size={15} />Share</button></div></section>
    <section className="team-earnings panel"><div><div className="eyebrow">TOTAL REFERRAL EARNINGS</div><strong>{formatAmount(data.totalReferralEarnings, 4)} <i>BTG</i></strong></div><div className="earnings-mark"><Gift size={21} /></div></section>
    <div className="team-levels"><section className="level-card panel"><div className="level-icon"><Users size={18} /></div><div className="eyebrow">LEVEL 1 · DIRECT</div><strong>{data.level1Count}</strong><p>People invited by you</p><span className="status">10% earning rate</span></section><section className="level-card panel"><div className="level-icon second"><TrendingUp size={18} /></div><div className="eyebrow">LEVEL 2 · INDIRECT</div><strong>{data.level2Count}</strong><p>Your team's referrals</p><span className="status">5% earning rate</span></section></div>
    <section><div className="section-row-head"><div><div className="eyebrow">YOUR REFERRALS</div><h2>Level one members</h2></div><span className="status">{data.level1Count} members</span></div>
      {data.level1.length === 0 ? <EmptyPanel title="Your network starts here" detail="Share your referral link to invite your first member." /> : <div className="member-list panel">{data.level1.map((member) => <div key={`${member.username}-${member.joinedAt}`} className="member-row"><AccountInitial name={member.username} /><div className="member-main"><strong>{member.username}</strong><span>Joined {formatDate(member.joinedAt)}</span></div><div className="member-earned"><strong>+{formatAmount(member.totalEarned)} BTG</strong><span>Referral earnings</span></div></div>)}</div>}
    </section>
    <section><div className="section-row-head"><div><div className="eyebrow">SECOND LEVEL</div><h2>Extended network</h2></div><span className="status">{data.level2Count} members</span></div>
      {data.level2.length === 0 ? <div className="quiet-empty">Your extended network will appear here as your referrals invite new members.</div> : <div className="member-list panel">{data.level2.map((member) => <div key={`${member.username}-${member.joinedAt}`} className="member-row"><AccountInitial name={member.username} /><div className="member-main"><strong>{member.username}</strong><span>Joined {formatDate(member.joinedAt)}</span></div><div className="member-earned"><strong>+{formatAmount(member.totalEarned)} BTG</strong><span>Referral earnings</span></div></div>)}</div>}
    </section>
  </div>;
}

export function WalletPage() {
  const walletQuery = useGetWallet({ query: { queryKey: getGetWalletQueryKey() } });
  const [action, setAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [symbol, setSymbol] = useState('BTG');
  const [balanceHidden, setBalanceHidden] = useState(false);
  if (walletQuery.isLoading) return <LoadingPanel label="Loading wallet" />;
  if (walletQuery.isError || !walletQuery.data) return <ErrorPanel message="The wallet ledger could not be loaded." onRetry={() => walletQuery.refetch()} />;
  const wallet = walletQuery.data;
  const symbols = wallet.assets;
  return <div className="screen-stack">
    <PageHeading eyebrow="ACCOUNT LEDGER" title="Wallet" description="Your internal Bitgold asset balances and activity." />
    <section className="wallet-hero panel"><div className="wallet-hero-glow" /><div className="wallet-topline"><div className="eyebrow">TOTAL AVAILABLE</div><button className="icon-button" onClick={() => setBalanceHidden((current) => !current)} aria-label={balanceHidden ? 'Show balances' : 'Hide balances'} data-testid="button-toggle-balance">{balanceHidden ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
      <div className="wallet-total">{balanceHidden ? '••••••' : formatAmount(wallet.availableBalance, 4)} <span>BTG</span></div>
      <div className="wallet-pending">{balanceHidden ? '••••' : formatAmount(wallet.pendingBalance, 4)} BTG pending review</div>
      <div className="wallet-actions"><button className="button gold" onClick={() => { setAction('deposit'); setSymbol('BTG'); }} data-testid="button-wallet-deposit"><ArrowDownToLine size={16} />Request deposit</button><button className="button" onClick={() => { setAction('withdraw'); setSymbol('BTG'); }} data-testid="button-wallet-withdraw"><ArrowUpFromLine size={16} />Request withdrawal</button></div>
    </section>
    <InlineNotice>BTG is an internal token balance, not a live-chain wallet. Deposit and withdrawal requests are pending until administrator review.</InlineNotice>
    <section><div className="section-row-head"><div><div className="eyebrow">YOUR ASSETS</div><h2>Asset balances</h2></div></div>
      {symbols.length === 0 ? <EmptyPanel title="No assets are available" detail="Asset balances will appear here when returned by your account ledger." /> : <div className="asset-list panel">{symbols.map((asset) => <AssetRow key={asset.symbol} asset={asset} hidden={balanceHidden} onDeposit={() => { setSymbol(asset.symbol); setAction('deposit'); }} onWithdraw={() => { setSymbol(asset.symbol); setAction('withdraw'); }} />)}</div>}
    </section>
    <section><div className="section-row-head"><div><div className="eyebrow">RECENT LEDGER</div><h2>Transactions</h2></div></div><TransactionList transactions={wallet.transactions} /></section>
    <WalletActionModal open={action !== null} action={action} symbol={symbol} onClose={() => setAction(null)} available={wallet.assets.find((asset) => asset.symbol === symbol)?.availableBalance ?? wallet.availableBalance} />
  </div>;
}

export function AssetDetailPage() {
  const params = useParams<{ symbol: string }>();
  const walletQuery = useGetWallet({ query: { queryKey: getGetWalletQueryKey() } });
  const [action, setAction] = useState<'deposit' | 'withdraw' | null>(null);
  const symbol = (params.symbol ?? '').toUpperCase();
  const asset = walletQuery.data?.assets.find((item) => item.symbol.toUpperCase() === symbol);
  if (walletQuery.isLoading) return <LoadingPanel label="Loading asset details" />;
  if (walletQuery.isError) return <ErrorPanel message="Asset details are temporarily unavailable." onRetry={() => walletQuery.refetch()} />;
  if (!asset) return <div className="screen-stack"><Link href="/app/wallet" className="inline-link"><ArrowLeft size={15} /> Back to wallet</Link><EmptyPanel title="Asset not found" detail="This symbol is not part of your current wallet." /></div>;
  const isBitgold = asset.symbol.toUpperCase() === 'BTG';
  const txs = walletQuery.data?.transactions.filter((tx) => tx.assetSymbol.toUpperCase() === symbol) ?? [];
  return <div className="screen-stack"><Link href="/app/wallet" className="inline-link"><ArrowLeft size={15} /> Wallet</Link>
    <section className="asset-detail-hero panel"><div className="token-badge token-badge-large">{symbol.slice(0, 1)}</div><div className="eyebrow">{asset.symbol}</div><h1>{asset.name}</h1><strong>{formatAmount(asset.balance)} <i>{asset.symbol}</i></strong><p>{formatAmount(asset.pendingBalance)} pending review</p>{!isBitgold && <span className="status">Display only</span>}</section>
    {isBitgold ? <div className="wallet-actions detail-actions"><button className="button gold" onClick={() => setAction('deposit')} data-testid="button-asset-deposit"><ArrowDownToLine size={15} />Request deposit</button><button className="button" onClick={() => setAction('withdraw')} data-testid="button-asset-withdraw"><ArrowUpFromLine size={15} />Request withdrawal</button></div> : <InlineNotice tone="gold">{asset.symbol} is display-only. Wallet actions are available for BTG.</InlineNotice>}
    <section><div className="section-row-head"><div><div className="eyebrow">ASSET LEDGER</div><h2>Transactions</h2></div></div><TransactionList transactions={txs} /></section>
    <WalletActionModal open={action !== null} action={action} symbol={asset.symbol} onClose={() => setAction(null)} available={asset.availableBalance} />
  </div>;
}

function AssetRow({ asset, hidden, onDeposit, onWithdraw }: { asset: WalletAsset; hidden: boolean; onDeposit: () => void; onWithdraw: () => void }) {
  return <div className="asset-row"><Link href={`/app/wallet/${asset.symbol.toLowerCase()}`} className="asset-main-link"><div className="token-badge">{asset.symbol.slice(0, 1)}</div><div className="asset-name"><strong>{asset.name}</strong><span>{asset.symbol} <i className={asset.change24h >= 0 ? 'gain' : 'loss'}>{asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%</i></span></div><div className="asset-balance">{hidden ? '••••••' : formatAmount(asset.balance)}<small>{asset.symbol}</small></div><ChevronRight size={16} className="muted" /></Link>
    <div className="asset-mini-actions"><button onClick={onDeposit} aria-label={`Request ${asset.symbol} deposit`} data-testid={`button-deposit-${asset.symbol.toLowerCase()}`}><ArrowDownToLine size={13} /></button><button onClick={onWithdraw} aria-label={`Request ${asset.symbol} withdrawal`} data-testid={`button-withdraw-${asset.symbol.toLowerCase()}`}><ArrowUpFromLine size={13} /></button></div>
  </div>;
}

function WalletActionModal({ open, action, symbol, onClose, available }: { open: boolean; action: 'deposit' | 'withdraw' | null; symbol: string; onClose: () => void; available: number }) {
  const queryClient = useQueryClient();
  const deposit = useRequestDeposit();
  const withdrawal = useRequestWithdrawal();
  const [amount, setAmount] = useState('');
  const [hash, setHash] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [error, setError] = useState('');
  const pending = deposit.isPending || withdrawal.isPending;
  const clearAndClose = () => { setAmount(''); setHash(''); setAddress(''); setNetwork(''); setError(''); setIdempotencyKey(''); onClose(); };
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetAccountQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }),
    ]);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError('Enter an amount greater than zero.'); return; }
    if (action === 'withdraw' && numericAmount > available) { setError('The requested amount exceeds your available balance.'); return; }
    try {
      const requestKey = idempotencyKey || window.crypto.randomUUID();
      if (!idempotencyKey) setIdempotencyKey(requestKey);
      if (action === 'deposit') {
        await deposit.mutateAsync({ data: { assetSymbol: symbol, amount: numericAmount, idempotencyKey: requestKey, ...(hash.trim() ? { transactionHash: hash.trim() } : {}) } });
      } else {
        if (address.trim().length < 10) { setError('Enter a wallet address of at least 10 characters.'); return; }
        await withdrawal.mutateAsync({
          data: {
            assetSymbol: symbol, amount: numericAmount, walletAddress: address.trim(),
            ...(network.trim() ? { network: network.trim() } : {}),
            idempotencyKey: requestKey,
          },
        });
      }
      await invalidate();
      clearAndClose();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'The request could not be submitted. Please try again.'));
    }
  };
  return <Modal open={open} onClose={clearAndClose} title={action === 'deposit' ? `Request a ${symbol} deposit` : `Request a ${symbol} withdrawal`} description="This creates a request for administrator review. It does not send a live-chain transaction.">
    {action && <form className="modal-form" onSubmit={submit}>
      <div className="modal-balance"><span>AVAILABLE</span><strong>{formatAmount(available)} {symbol}</strong></div>
      {error && <InlineNotice tone="danger">{error}</InlineNotice>}
      <label className="field-label" htmlFor="request-amount">Amount</label><input id="request-amount" className="field mono" type="number" min="0.00000001" step="any" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.0000" data-testid="input-request-amount" />
      {action === 'deposit' ? <><label className="field-label" htmlFor="deposit-hash">Transaction reference <span className="optional">(optional)</span></label><input id="deposit-hash" className="field mono" maxLength={160} value={hash} onChange={(event) => setHash(event.target.value)} placeholder="Paste an existing reference" data-testid="input-deposit-reference" /><InlineNotice>Only request a deposit after arranging it through an authorized Bitgold channel.</InlineNotice></> : <>
        <label className="field-label" htmlFor="withdraw-address">Destination wallet address</label><input id="withdraw-address" className="field mono" required minLength={10} maxLength={160} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter destination address" data-testid="input-withdraw-address" />
        <label className="field-label" htmlFor="withdraw-network">Network <span className="optional">(optional)</span></label><input id="withdraw-network" className="field" maxLength={40} value={network} onChange={(event) => setNetwork(event.target.value)} placeholder="e.g. BTG mainnet" data-testid="input-withdraw-network" /><InlineNotice tone="gold">No funds move until an administrator reviews and approves this request.</InlineNotice>
      </>}
      <div className="modal-actions"><button type="button" className="button" onClick={clearAndClose}>Cancel</button><button type="submit" disabled={pending} className="button gold" data-testid="button-submit-wallet-request">{pending ? 'Submitting…' : 'Submit request'}</button></div>
    </form>}
  </Modal>;
}

function TransactionList({ transactions }: { transactions: WalletTransaction[] }) {
  if (transactions.length === 0) return <EmptyPanel title="No ledger activity yet" detail="Mining rewards and wallet requests will appear here." />;
  return <div className="activity-list panel">{transactions.map((tx) => {
    const positive = tx.type === 'mining' || tx.type === 'referral';
    const Icon = positive ? ArrowDownLeft : tx.type === 'deposit' ? ArrowDownToLine : ArrowUpFromLine;
    return <article className="activity-row" key={tx.id}><span className={`activity-icon ${positive ? 'positive' : ''}`}><Icon size={16} /></span><div className="activity-main"><strong>{tx.description || `${tx.type} · ${tx.assetSymbol}`}</strong><span>{formatDate(tx.createdAt)} · <span className={`status ${tx.status}`}>{tx.status}</span></span></div><div className={`activity-amount ${positive ? 'gain' : ''}`}>{positive ? '+' : tx.type === 'withdrawal' ? '−' : ''}{formatAmount(tx.amount)} <small>{tx.assetSymbol}</small></div></article>;
  })}</div>;
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const accountQuery = useGetAccount({ query: { queryKey: getGetAccountQueryKey() } });
  const updateProfile = useUpdateProfile({
    mutation: { onSuccess: async (account) => {
      queryClient.setQueryData(getGetAccountQueryKey(), account);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetTeamQueryKey() }),
      ]);
    } },
  });
  const { signOut, rotateAccountKey } = useAuth();
  const account = accountQuery.data;
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('');
  const [profileError, setProfileError] = useState('');
  const [currentKey, setCurrentKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);
  const [showNewKey, setShowNewKey] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);
  const [copied, setCopied] = useState(false);
  if (accountQuery.isLoading) return <LoadingPanel label="Loading profile" />;
  if (accountQuery.isError || !account) return <ErrorPanel message="Your account profile could not be loaded." onRetry={() => accountQuery.refetch()} />;
  const edit = () => { setDisplayName(account.displayName ?? ''); setCountry(account.country ?? ''); setEditing(true); setProfileError(''); };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    updateProfile.mutate({ data: { displayName: displayName.trim(), country: country.trim() } }, {
      onSuccess: () => setEditing(false),
      onError: (error) => setProfileError(apiErrorMessage(error, 'Profile update failed.')),
    });
  };
  const rotateKey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setKeyError('');
    setKeyBusy(true);
    const generated = makeAccountKey();
    try {
      const rotated = await rotateAccountKey({ currentKey, newKey: generated });
      setShowNewKey(rotated.accountKey);
      setCurrentKey('');
      setNewKey('');
    } catch (error) {
      setKeyError(apiErrorMessage(error, 'The key could not be rotated. Verify your current key and try again.'));
    } finally {
      setKeyBusy(false);
    }
  };
  const copyReferral = async () => { await navigator.clipboard.writeText(account.referralCode); setCopied(true); window.setTimeout(() => setCopied(false), 1500); };
  const copyNewKey = async () => { await navigator.clipboard.writeText(showNewKey); setKeyCopied(true); window.setTimeout(() => setKeyCopied(false), 1500); };
  return <div className="screen-stack">
    <PageHeading eyebrow="ACCOUNT SETTINGS" title="Profile" description="Your account details, security, and Bitgold information." />
    <section className="profile-card panel"><div className="profile-card-glow" /><div className="profile-identity"><AccountInitial name={account.displayName || account.username} /><div><h2>{account.displayName || account.username}</h2><span>@{account.username}</span></div><span className={`status ${account.status}`}>{account.status}</span></div><div className="profile-referral"><div><span className="eyebrow">YOUR REFERRAL CODE</span><strong>{account.referralCode}</strong></div><button className="icon-button" onClick={copyReferral} aria-label="Copy referral code" data-testid="button-copy-profile-referral">{copied ? <Check size={17} /> : <Copy size={17} />}</button></div></section>
    <div className="profile-stats"><article className="panel"><FlameGlyph /><span>Mining streak</span><strong>{account.streak} <i>days</i></strong></article><article className="panel"><Zap size={17} /><span>Hash power</span><strong>{formatAmount(account.hashPower, 0)}</strong></article><article className="panel"><Gift size={17} /><span>Total mined</span><strong>{formatAmount(account.totalMined, 3)} <i>BTG</i></strong></article><article className="panel"><Users size={17} /><span>Referral earnings</span><strong>{formatAmount(account.totalReferralEarnings, 3)} <i>BTG</i></strong></article></div>
    <section className="settings-panel panel"><div className="settings-title"><div><Settings2 size={17} /><h2>Profile information</h2></div>{!editing && <button className="text-button" onClick={edit} data-testid="button-edit-profile">Edit details</button>}</div>
      {editing ? <form className="modal-form" onSubmit={save}>{profileError && <InlineNotice tone="danger">{profileError}</InlineNotice>}<label className="field-label" htmlFor="display-name">Display name</label><input className="field" id="display-name" maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} data-testid="input-display-name" /><label className="field-label" htmlFor="country">Country</label><input className="field" id="country" maxLength={80} value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Country" data-testid="input-country" /><div className="modal-actions"><button type="button" className="button" onClick={() => setEditing(false)}>Cancel</button><button className="button gold" type="submit" disabled={updateProfile.isPending} data-testid="button-save-profile">{updateProfile.isPending ? 'Saving…' : 'Save changes'}</button></div></form> : <div className="settings-values"><div><span>Username</span><strong>{account.username}</strong></div><div><span>Display name</span><strong>{account.displayName || 'Not set'}</strong></div><div><span>Country</span><strong>{account.country || 'Not set'}</strong></div><div><span>Account role</span><strong>{account.role}</strong></div></div>}
    </section>
    <section className="settings-panel panel"><div className="settings-title"><div><KeyRound size={17} /><h2>Account key</h2></div><span className="status active">Salted hash</span></div><p className="muted">Your key is your password credential. Generate a replacement here. The new key appears once and the server keeps only its salted hash.</p>
      {showNewKey ? <div className="key-rotation-success"><InlineNotice tone="success">Key rotated. Save the new key now; it will not appear again after you leave this screen.</InlineNotice><div className="key-reveal"><code>{showNewKey}</code><button className="icon-button" onClick={copyNewKey} aria-label="Copy new key" data-testid="button-copy-rotated-key">{keyCopied ? <Check size={17} /> : <Copy size={17} />}</button></div><button className="button" onClick={() => setShowNewKey('')} data-testid="button-dismiss-rotated-key">I saved my key</button></div> : <form className="key-rotation-form" onSubmit={rotateKey}>{keyError && <InlineNotice tone="danger">{keyError}</InlineNotice>}<label className="field-label" htmlFor="current-account-key">Current account key</label><input className="field mono" type="password" required value={currentKey} onChange={(event) => setCurrentKey(event.target.value)} id="current-account-key" data-testid="input-current-account-key" /><label className="field-label" htmlFor="new-account-key">Replacement key</label><div className="generated-key-field"><input className="field mono" type="password" readOnly value={newKey} placeholder="Generated during rotation" id="new-account-key" data-testid="input-new-account-key" /><button className="button" type="button" onClick={() => setNewKey(makeAccountKey())} data-testid="button-generate-new-key">Generate key</button></div><button className="button gold" type="submit" disabled={keyBusy || !currentKey || !newKey} data-testid="button-rotate-account-key">{keyBusy ? 'Rotating…' : 'Rotate account key'}</button></form>}
      <InlineNotice tone="gold">The service uses a single-active-device rule. A new-device sign-in requires explicit confirmation to switch.</InlineNotice>
    </section>
    <section className="privacy-link-card panel"><ShieldCheck size={18} /><div><strong>Privacy and device access</strong><p>Review how public IP addresses and sessions are handled.</p></div><Link href="/privacy" className="inline-link">Read notice <ArrowRight size={14} /></Link></section>
    <button className="button signout-button" onClick={() => { void signOut(); }} data-testid="button-signout"><LogOut size={16} />Sign out of Bitgold</button>
    <div className="profile-version"><Brand size={19} /> Bitgold Network · BTG</div>
  </div>;
}

function FlameGlyph() { return <span className="flame-mark">S</span>; }

function makeAccountKey() {
  const bytes = new Uint8Array(36);
  window.crypto.getRandomValues(bytes);
  return window.btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

