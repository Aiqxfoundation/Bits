import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity, ArrowDownToLine, ArrowRight, ArrowUpFromLine, Ban, Check, ChevronLeft, FileClock,
  Fingerprint, Search, ShieldAlert, ShieldCheck, Users, Wallet,
} from 'lucide-react';
import {
  getGetAccountQueryKey, getGetAdminAuditQueryKey, getGetAdminDepositsQueryKey, getGetAdminIpClustersQueryKey,
  getGetAdminOverviewQueryKey, getGetAdminUserQueryKey, getGetAdminUsersQueryKey, getGetAdminWithdrawalsQueryKey, useDecideDeposit,
  useDecideWithdrawal, useGetAdminAudit, useGetAdminDeposits, useGetAdminIpClusters, useGetAdminOverview,
  useGetAdminUser, useGetAdminUsers, useGetAdminWithdrawals, useUpdateAdminUser,
} from '@workspace/api-client-react';
import type { AdminUser, WalletTransaction } from '@workspace/api-client-react';
import { EmptyPanel, ErrorPanel, InlineNotice, LoadingPanel, Modal, PageHeading, apiErrorMessage, formatAmount, formatDate } from '@/components/common';

const adminNav = [
  { href: '/app/admin', label: 'Overview', icon: Activity },
  { href: '/app/admin/users', label: 'Users', icon: Users },
  { href: '/app/admin/deposits', label: 'Deposits', icon: ArrowDownToLine },
  { href: '/app/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
  { href: '/app/admin/risk', label: 'IP review', icon: Fingerprint },
  { href: '/app/admin/audit', label: 'Audit log', icon: FileClock },
];

export function AdminFrame({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <div className="admin-layout">
    <div className="admin-topline"><Link className="inline-link" href="/app"><ChevronLeft size={15} /> Wallet</Link><span className="admin-role-label"><ShieldCheck size={14} /> ADMIN CONSOLE</span></div>
    <nav className="admin-tabs" aria-label="Admin sections">{adminNav.map((item) => <Link className={`admin-tab ${location === item.href ? 'active' : ''}`} key={item.href} href={item.href} data-testid={`link-admin-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={15} /><span>{item.label}</span></Link>)}</nav>
    {children}
  </div>;
}

export function AdminOverviewPage() {
  const overviewQuery = useGetAdminOverview({ query: { queryKey: getGetAdminOverviewQueryKey(), refetchOnWindowFocus: true } });
  if (overviewQuery.isLoading) return <AdminFrame><LoadingPanel label="Loading admin overview" /></AdminFrame>;
  if (overviewQuery.isError || !overviewQuery.data) return <AdminFrame><ErrorPanel message="Admin overview is temporarily unavailable." onRetry={() => overviewQuery.refetch()} /></AdminFrame>;
  const data = overviewQuery.data;
  const tiles = [
    { label: 'Accounts', value: data.totalUsers.toLocaleString(), detail: `${data.activeUsers.toLocaleString()} active`, icon: Users },
    { label: 'Pending deposits', value: String(data.pendingDeposits), detail: 'Awaiting review', icon: ArrowDownToLine, tone: 'gold' },
    { label: 'Pending withdrawals', value: String(data.pendingWithdrawals), detail: 'Awaiting decision', icon: ArrowUpFromLine, tone: 'gold' },
    { label: 'Shared IP groups', value: String(data.sharedIpGroups), detail: 'Review signals only', icon: Fingerprint },
  ];
  return <AdminFrame><div className="screen-stack admin-content">
    <PageHeading eyebrow="OPERATIONS" title="Admin overview" description="Account and request totals from server-managed records." aside={<span className="status active">Authorized admin</span>} />
    <div className="admin-metrics">{tiles.map(({ label, value, detail, icon: Icon, tone }) => <article className="admin-metric panel" key={label}><div className="metric-top"><span>{label}</span><Icon size={17} className={tone === 'gold' ? 'metric-icon-gold' : ''} /></div><strong>{value}</strong><small>{detail}</small></article>)}</div>
    <section className="admin-summary panel"><div><span className="eyebrow">TOTAL ACCOUNT BALANCE</span><strong>{formatAmount(data.totalBalance, 4)} <i>BTG</i></strong><p className="muted">Internal ledger balance, not an on-chain total.</p></div><div className="admin-summary-art"><Wallet size={25} /></div></section>
    <section><div className="section-row-head"><div><div className="eyebrow">REVIEW QUEUE</div><h2>Choose a work area</h2></div></div><div className="admin-work-grid">
      <AdminWorkCard href="/app/admin/users" icon={Users} title="Manage users" detail={`${data.bannedUsers} banned accounts`} />
      <AdminWorkCard href="/app/admin/deposits" icon={ArrowDownToLine} title="Deposit requests" detail={`${data.pendingDeposits} need a decision`} />
      <AdminWorkCard href="/app/admin/withdrawals" icon={ArrowUpFromLine} title="Withdrawal requests" detail={`${data.pendingWithdrawals} need a decision`} />
      <AdminWorkCard href="/app/admin/risk" icon={ShieldAlert} title="IP review signals" detail={`${data.sharedIpGroups} shared-address groups`} />
      <AdminWorkCard href="/app/admin/audit" icon={FileClock} title="Audit activity" detail="Review recent admin actions" />
    </div></section>
    <InlineNotice>Administrator role and all sensitive actions are checked by the server. Review signals are not automatic findings.</InlineNotice>
  </div></AdminFrame>;
}

function AdminWorkCard({ href, icon: Icon, title, detail }: { href: string; icon: typeof Users; title: string; detail: string }) {
  return <Link className="admin-work-card panel" href={href}><span className="admin-work-icon"><Icon size={17} /></span><div><strong>{title}</strong><small>{detail}</small></div><ArrowRight size={15} /></Link>;
}

export function AdminUserDetailPage() {
  const { userId = '' } = useParams<{ userId: string }>();
  const query = useGetAdminUser(userId, { query: { queryKey: getGetAdminUserQueryKey(userId) } });
  if (query.isLoading) return <AdminFrame><div className="screen-stack admin-content"><LoadingPanel label="Loading member details" /></div></AdminFrame>;
  if (query.isError || !query.data) return <AdminFrame><div className="screen-stack admin-content"><ErrorPanel message="Member details are unavailable or the account no longer exists." onRetry={() => query.refetch()} /></div></AdminFrame>;
  const { user, walletBalances, transactions } = query.data;
  return <AdminFrame><div className="screen-stack admin-content">
    <Link href="/app/admin/users" className="inline-link"><ChevronLeft size={15} /> All users</Link>
    <PageHeading eyebrow="ADMIN · MEMBER RECORD" title={user.username} description="Account details and server-managed wallet activity." aside={<span className={`status ${user.status}`}>{user.status}</span>} />
    <div className="user-detail-grid"><article className="panel"><span className="eyebrow">ACCOUNT ROLE</span><strong>{user.role}</strong><small>{user.isInitialAdmin ? 'Initial administrator account' : 'Standard member account'}</small></article><article className="panel"><span className="eyebrow">JOINED</span><strong>{formatDate(user.joinedAt)}</strong><small>Account created on Bitgold</small></article><article className="panel"><span className="eyebrow">BTG BALANCE</span><strong>{formatAmount(user.balance)} <i>BTG</i></strong><small>Internal ledger value</small></article></div>
    <section><div className="section-row-head"><div><div className="eyebrow">WALLET BALANCES</div><h2>Assets</h2></div></div>
      {walletBalances.length === 0 ? <EmptyPanel title="No wallet balances" detail="No asset balances are available for this account." /> : <div className="table-wrap"><table><thead><tr><th>Asset</th><th>Balance</th><th>Available</th><th>Pending</th></tr></thead><tbody>{walletBalances.map((asset) => <tr key={asset.symbol}><td><strong>{asset.name}</strong><span className="muted"> · {asset.symbol}</span></td><td className="mono">{formatAmount(asset.balance)}</td><td className="mono">{formatAmount(asset.availableBalance)}</td><td className="mono">{formatAmount(asset.pendingBalance)}</td></tr>)}</tbody></table></div>}
    </section>
    <section><div className="section-row-head"><div><div className="eyebrow">LEDGER HISTORY</div><h2>Recent transactions</h2></div><span className="admin-count">{transactions.length} records</span></div>
      {transactions.length === 0 ? <EmptyPanel title="No transaction history" detail="The member's ledger has no recorded activity." /> : <div className="table-wrap"><table><thead><tr><th>Type</th><th>Amount</th><th>Status</th><th>Created</th><th>Reference</th></tr></thead><tbody>{transactions.map((tx) => <tr key={tx.id}><td>{tx.description || tx.type}</td><td className="mono">{formatAmount(tx.amount)} {tx.assetSymbol}</td><td><span className={`status ${tx.status}`}>{tx.status}</span></td><td>{formatDate(tx.createdAt)}</td><td className="mono">{tx.transactionHash || tx.walletAddress || '—'}</td></tr>)}</tbody></table></div>}
    </section>
  </div></AdminFrame>;
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [state, setState] = useState<'all' | 'active' | 'banned'>('all');
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [actionError, setActionError] = useState('');
  const params = { search: search.trim() || undefined, status: state, limit: 100, offset: 0 };
  const usersQuery = useGetAdminUsers(params);
  const updateUser = useUpdateAdminUser({
    mutation: { onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAdminAuditQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAccountQueryKey() }),
      ]);
      setTarget(null);
    } },
  });
  const confirm = async () => {
    if (!target) return;
    setActionError('');
    try {
      await updateUser.mutateAsync({ userId: target.id, data: { status: target.status === 'active' ? 'banned' : 'active' } });
      setTarget(null);
    } catch (error) { setActionError(apiErrorMessage(error, 'The account status was not changed.')); }
  };
  return <AdminFrame><div className="screen-stack admin-content">
    <PageHeading eyebrow="ACCOUNT MANAGEMENT" title="Users" description="Review member accounts and apply an explicit ban or unban decision." aside={<span className="admin-count">{usersQuery.data?.total ?? '—'} total</span>} />
    <div className="admin-filter-row"><label className="admin-search"><Search size={16} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search username" aria-label="Search by username" data-testid="input-search-admin-users" /></label><select className="field admin-select" value={state} onChange={(event) => setState(event.target.value as 'all' | 'active' | 'banned')} aria-label="Filter users by status" data-testid="select-user-status"><option value="all">All accounts</option><option value="active">Active</option><option value="banned">Banned</option></select></div>
    {usersQuery.isLoading ? <LoadingPanel label="Loading account list" /> : usersQuery.isError ? <ErrorPanel message="The member list could not be retrieved." onRetry={() => usersQuery.refetch()} /> : (usersQuery.data?.items.length ?? 0) === 0 ? <EmptyPanel title="No accounts match" detail="Try another username or filter." /> :
      <div className="table-wrap"><table><thead><tr><th>Username</th><th>Status</th><th>Role</th><th>Balance</th><th>Joined</th><th>Action</th></tr></thead><tbody>
        {usersQuery.data?.items.map((user) => <tr key={user.id} data-testid={`row-admin-user-${user.id}`}><td><Link href={`/app/admin/users/${user.id}`} className="admin-user-link"><strong>{user.username}</strong></Link>{user.isInitialAdmin && <span className="initial-admin">Initial admin</span>}</td><td><span className={`status ${user.status}`}>{user.status}</span></td><td>{user.role}</td><td className="mono">{formatAmount(user.balance)}</td><td>{formatDate(user.joinedAt)}</td><td><button className={`button table-action ${user.status === 'active' ? 'button-danger' : ''}`} disabled={user.isInitialAdmin || updateUser.isPending} onClick={() => { setTarget(user); setActionError(''); }} data-testid={`button-toggle-user-${user.id}`}>{user.status === 'active' ? <><Ban size={13} /> Ban</> : <><Check size={13} /> Unban</>}</button></td></tr>)}
      </tbody></table></div>}
    <InlineNotice tone="gold">Public IP and shared-IP signals are not shown in general user listings. Review them only in the admin IP review page.</InlineNotice>
    <Modal open={Boolean(target)} onClose={() => setTarget(null)} title={target?.status === 'active' ? 'Ban this account?' : 'Restore this account?'} description={target ? `You are about to ${target.status === 'active' ? 'ban' : 'unban'} @${target.username}. This action is recorded in the audit log.` : undefined}>
      {actionError && <InlineNotice tone="danger">{actionError}</InlineNotice>}<div className="modal-actions"><button className="button" onClick={() => setTarget(null)}>Cancel</button><button className={`button ${target?.status === 'active' ? 'button-danger' : 'gold'}`} onClick={confirm} disabled={updateUser.isPending} data-testid="button-confirm-user-status">{updateUser.isPending ? 'Saving…' : target?.status === 'active' ? 'Confirm ban' : 'Confirm unban'}</button></div>
    </Modal>
  </div></AdminFrame>;
}

function AdminRequestPage({ kind }: { kind: 'deposit' | 'withdrawal' }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected' | 'approved'>('pending');
  const [target, setTarget] = useState<WalletTransaction | null>(null);
  const [decision, setDecision] = useState('');
  const [note, setNote] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [actionError, setActionError] = useState('');
  const depQuery = useGetAdminDeposits({ status: filter === 'approved' ? 'all' : filter, limit: 100, offset: 0 });
  const withQuery = useGetAdminWithdrawals({ status: filter === 'confirmed' ? 'all' : filter, limit: 100, offset: 0 });
  const decideDeposit = useDecideDeposit({
    mutation: { onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetAdminDepositsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAdminAuditQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAccountQueryKey() }),
      ]);
      setTarget(null); setDecision(''); setNote('');
    } },
  });
  const decideWithdrawal = useDecideWithdrawal({
    mutation: { onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetAdminWithdrawalsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAdminAuditQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAccountQueryKey() }),
      ]);
      setTarget(null); setDecision(''); setNote(''); setTransactionHash('');
    } },
  });
  const query = kind === 'deposit' ? depQuery : withQuery;
  const page = query.data;
  const pending = decideDeposit.isPending || decideWithdrawal.isPending;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!target || !decision) return;
    setActionError('');
    try {
      if (kind === 'deposit') {
        await decideDeposit.mutateAsync({ depositId: target.id, data: { decision: decision as 'confirmed' | 'rejected', ...(note.trim() ? { note: note.trim() } : {}) } });
      } else {
        await decideWithdrawal.mutateAsync({ withdrawalId: target.id, data: { decision: decision as 'approved' | 'rejected', ...(note.trim() ? { note: note.trim() } : {}), ...(transactionHash.trim() ? { transactionHash: transactionHash.trim() } : {}) } });
      }
    } catch (error) { setActionError(apiErrorMessage(error, 'The request could not be decided.')); }
  };
  const filterValues = kind === 'deposit' ? ['pending', 'confirmed', 'rejected', 'all'] : ['pending', 'approved', 'rejected', 'all'];
  const items = page?.items ?? [];
  return <AdminFrame><div className="screen-stack admin-content">
    <PageHeading eyebrow="MANUAL REVIEW" title={kind === 'deposit' ? 'Deposit requests' : 'Withdrawal requests'} description={kind === 'deposit' ? 'Confirm only after independently verifying the submitted deposit.' : 'Review destination, amount, and account balance before approval.'} aside={<span className="admin-count">{page?.total ?? '—'} requests</span>} />
    <div className="admin-filter-row"><div className="filter-pills">{filterValues.map((value) => <button key={value} className={`filter-pill ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value as typeof filter)} data-testid={`button-filter-${kind}-${value}`}>{value === 'all' ? 'All' : value[0].toUpperCase() + value.slice(1)}</button>)}</div><span className="muted">Each decision is audit logged</span></div>
    {query.isLoading ? <LoadingPanel label={`Loading ${kind} requests`} /> : query.isError ? <ErrorPanel message={`The ${kind} queue could not be loaded.`} onRetry={() => query.refetch()} /> : items.length === 0 ? <EmptyPanel title={`No ${filter === 'pending' ? 'pending ' : ''}${kind} requests`} detail="Requests will appear here when submitted." /> : <div className="table-wrap"><table><thead><tr><th>Account</th><th>Amount</th><th>Reference</th><th>Submitted</th><th>Status</th><th>Review</th></tr></thead><tbody>
      {items.map((item) => <tr key={item.id} data-testid={`row-${kind}-${item.id}`}><td><strong>{item.username || item.userId || 'Member'}</strong></td><td className="mono">{formatAmount(item.amount)} {item.assetSymbol}</td><td className="mono">{kind === 'deposit' ? item.transactionHash || 'No reference' : item.walletAddress || '—'}</td><td>{formatDate(item.createdAt)}</td><td><span className={`status ${item.status}`}>{item.status}</span></td><td>{item.status === 'pending' ? <button className="button table-action" onClick={() => { setTarget(item); setDecision(''); setNote(''); setTransactionHash(''); setActionError(''); }} data-testid={`button-review-${kind}-${item.id}`}>Review</button> : <span className="muted">Decided</span>}</td></tr>)}
    </tbody></table></div>}
    <InlineNotice tone="gold">These are manual requests against the internal ledger. No chain transaction is created by accepting a request.</InlineNotice>
    <Modal open={Boolean(target)} onClose={() => setTarget(null)} title={`Review ${kind}`} description={target ? `${target.username || 'Account'} · ${formatAmount(target.amount)} ${target.assetSymbol}` : undefined}>
      {target && <form className="modal-form" onSubmit={submit}>
        <div className="request-review-card"><span className="eyebrow">REQUEST DETAILS</span><p><strong>Account</strong><span>{target.username || target.userId || 'Member'}</span></p><p><strong>Amount</strong><span className="mono">{formatAmount(target.amount)} {target.assetSymbol}</span></p>{kind === 'deposit' && <p><strong>Reference</strong><span className="mono">{target.transactionHash || 'Not provided'}</span></p>}{kind === 'withdrawal' && <><p><strong>Destination</strong><span className="mono break-word">{target.walletAddress}</span></p><p><strong>Network</strong><span>{target.network || 'Not specified'}</span></p></>}</div>
        {actionError && <InlineNotice tone="danger">{actionError}</InlineNotice>}
        <label className="field-label" htmlFor="decision-note">Administrator note <span className="optional">(optional)</span></label><textarea id="decision-note" className="field textarea" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a reason or internal note" data-testid="input-admin-decision-note" />
        {kind === 'withdrawal' && <><label className="field-label" htmlFor="admin-tx-hash">Transaction reference <span className="optional">(optional)</span></label><input id="admin-tx-hash" className="field mono" maxLength={160} value={transactionHash} onChange={(event) => setTransactionHash(event.target.value)} placeholder="Enter an external reference if applicable" data-testid="input-admin-transaction-hash" /></>}
        <label className="field-label">Decision</label><div className="decision-options">{(kind === 'deposit' ? ['confirmed', 'rejected'] : ['approved', 'rejected']).map((choice) => <button type="button" key={choice} onClick={() => setDecision(choice)} className={`decision-choice ${decision === choice ? 'selected' : ''}`} data-testid={`button-decision-${choice}`}>{choice === 'rejected' ? <Ban size={15} /> : <Check size={15} />}{choice}</button>)}</div>
        <div className="modal-actions"><button type="button" className="button" onClick={() => setTarget(null)}>Cancel</button><button type="submit" className="button gold" disabled={pending || !decision} data-testid={`button-submit-${kind}-decision`}>{pending ? 'Saving decision…' : 'Confirm decision'}</button></div>
      </form>}
    </Modal>
  </div></AdminFrame>;
}

export function AdminDepositsPage() { return <AdminRequestPage kind="deposit" />; }
export function AdminWithdrawalsPage() { return <AdminRequestPage kind="withdrawal" />; }

export function AdminRiskPage() {
  const query = useGetAdminIpClusters({ query: { queryKey: getGetAdminIpClustersQueryKey(), refetchOnWindowFocus: true } });
  const clusters = query.data?.items ?? [];
  return <AdminFrame><div className="screen-stack admin-content">
    <PageHeading eyebrow="ADMIN ONLY · SECURITY REVIEW" title="Shared IP review" description="Public IP clusters are context for manual review, not an automatic fraud verdict." />
    <div className="risk-notice"><div className="risk-notice-icon"><ShieldAlert size={19} /></div><div><strong>Review signal, not a finding</strong><p>Many people can share one public IP through a household, workplace, school, carrier network, VPN, or proxy. Never treat shared IP alone as evidence of abuse or an automatic reason to ban.</p></div></div>
    {query.isLoading ? <LoadingPanel label="Loading IP review signals" /> : query.isError ? <ErrorPanel message="IP review information is unavailable." onRetry={() => query.refetch()} /> : clusters.length === 0 ? <EmptyPanel title="No shared-IP groups" detail="No review signals are currently available." /> : <div className="risk-clusters">{clusters.map((cluster) => <section className="risk-cluster panel" key={cluster.publicIp} data-testid={`card-ip-cluster-${cluster.publicIp}`}><div className="cluster-heading"><div><span className="eyebrow">SHARED PUBLIC IP · REVIEW SIGNAL</span><h2 className="mono">{cluster.publicIp}</h2><p className="muted">{cluster.accountCount} accounts · seen {formatDate(cluster.firstSeenAt)} to {formatDate(cluster.lastSeenAt)}</p></div><span className="status">Manual review</span></div><div className="cluster-members">{cluster.accounts.map((account) => <div className="cluster-member" key={account.id}><span className="cluster-member-avatar">{account.username.slice(0, 1).toUpperCase()}</span><div><strong>{account.username}</strong><span>{account.role} · joined {formatDate(account.joinedAt)}</span></div><span className={`status ${account.status}`}>{account.status}</span></div>)}</div><div className="cluster-foot"><Fingerprint size={14} /><span>Do not infer account ownership or intent from IP overlap alone.</span></div></section>)}</div>}
    <InlineNotice>IP cluster data is restricted to this server-authorized admin area. It is not exposed in member profile, team, or wallet screens.</InlineNotice>
  </div></AdminFrame>;
}

export function AdminAuditPage() {
  const queryClient = useQueryClient();
  const query = useGetAdminAudit({ limit: 100, offset: 0 }, { query: { queryKey: getGetAdminAuditQueryKey({ limit: 100, offset: 0 }), refetchOnWindowFocus: true } });
  const events = query.data?.items ?? [];
  return <AdminFrame><div className="screen-stack admin-content">
    <PageHeading eyebrow="ACCOUNTABILITY" title="Audit log" description="A record of administrative decisions and sensitive actions." aside={<button className="button" onClick={() => queryClient.invalidateQueries({ queryKey: getGetAdminAuditQueryKey() })} data-testid="button-refresh-audit"><Activity size={14} />Refresh</button>} />
    {query.isLoading ? <LoadingPanel label="Loading audit log" /> : query.isError ? <ErrorPanel message="The audit history could not be loaded." onRetry={() => query.refetch()} /> : events.length === 0 ? <EmptyPanel title="No audit events yet" detail="Administrative activity will be recorded here." /> : <div className="audit-list panel">{events.map((event) => <article className="audit-row" key={event.id} data-testid={`row-audit-${event.id}`}><div className="audit-icon"><FileClock size={16} /></div><div className="audit-event-copy"><strong>{event.action}</strong><p>{event.details || 'Administrative action recorded.'}</p><span>{event.actorUsername} <i>→</i> {event.target}</span></div><time>{new Date(event.createdAt).toLocaleString()}</time></article>)}</div>}
    <InlineNotice>Audit data is read-only in this interface. The server remains the source of truth.</InlineNotice>
  </div></AdminFrame>;
}

