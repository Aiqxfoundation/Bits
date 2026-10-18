import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Brand, InlineNotice, LoadingPanel } from '@/components/common';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AdminAuditPage, AdminDepositsPage, AdminOverviewPage, AdminRiskPage, AdminUserDetailPage, AdminUsersPage, AdminWithdrawalsPage } from '@/pages/Admin';
import { SignInPage, SignUpPage } from '@/pages/Auth';
import { Goldpaper, Landing, Privacy } from '@/pages/Public';
import { AppLayout, AssetDetailPage, DashboardPage, ProfilePage, TeamPage, WalletPage } from '@/pages/WalletApp';
import { getGetAccountQueryKey, useGetAccount } from '@workspace/api-client-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function HomeRoute() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <Redirect to="/app" /> : <Landing />;
}

function RequireSignedIn({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? children : <Redirect to="/sign-in" />;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const accountQuery = useGetAccount({ query: { queryKey: getGetAccountQueryKey() } });
  if (accountQuery.isLoading) return <div className="app-frame"><main className="app-main"><LoadingPanel label="Verifying administrator access" /></main></div>;
  if (accountQuery.isError || accountQuery.data?.role !== 'admin') return <AppLayout><div className="screen-stack"><div className="eyebrow">ACCESS CONTROL</div><h1 className="heading-title">Administrator access required</h1><InlineNotice tone="danger">The current server account is not authorized for this area. Access cannot be granted by changing client settings.</InlineNotice><Link href="/app" className="button" data-testid="link-return-app">Return to wallet</Link></div></AppLayout>;
  return <AppLayout>{children}</AppLayout>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function MissingPage() {
  return <main className="not-found-page"><div className="eyebrow">404 · NOT FOUND</div><h1>That page is not in the ledger.</h1><p className="muted">The address may have changed or the page may no longer exist.</p><Link className="button gold" href="/">Return to Bitgold</Link></main>;
}

function RouteShell({ page }: { page: ReactNode }) {
  return <RequireSignedIn><AppLayout>{page}</AppLayout></RequireSignedIn>;
}

function AdminRoute({ page }: { page: ReactNode }) {
  return <RequireSignedIn><RequireAdmin>{page}</RequireAdmin></RequireSignedIn>;
}

function Routes() {
  return <RoutedErrorBoundary>
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/goldpaper" component={Goldpaper} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/app" component={() => <RouteShell page={<DashboardPage />} />} />
      <Route path="/app/team" component={() => <RouteShell page={<TeamPage />} />} />
      <Route path="/app/wallet" component={() => <RouteShell page={<WalletPage />} />} />
      <Route path="/app/wallet/:symbol" component={() => <RouteShell page={<AssetDetailPage />} />} />
      <Route path="/app/profile" component={() => <RouteShell page={<ProfilePage />} />} />
      <Route path="/app/admin" component={() => <AdminRoute page={<AdminOverviewPage />} />} />
      <Route path="/app/admin/users/:userId" component={() => <AdminRoute page={<AdminUserDetailPage />} />} />
      <Route path="/app/admin/users" component={() => <AdminRoute page={<AdminUsersPage />} />} />
      <Route path="/app/admin/deposits" component={() => <AdminRoute page={<AdminDepositsPage />} />} />
      <Route path="/app/admin/withdrawals" component={() => <AdminRoute page={<AdminWithdrawalsPage />} />} />
      <Route path="/app/admin/risk" component={() => <AdminRoute page={<AdminRiskPage />} />} />
      <Route path="/app/admin/audit" component={() => <AdminRoute page={<AdminAuditPage />} />} />
      <Route component={MissingPage} />
    </Switch>
  </RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <Routes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>;
}

export default App;
