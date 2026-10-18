import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Brand, InlineNotice, LoadingPanel } from '@/components/common';
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

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#c7a44a',
    colorForeground: '#f6f2e8',
    colorMutedForeground: '#99948a',
    colorDanger: '#df6d76',
    colorBackground: '#171411',
    colorInput: '#100f0d',
    colorInputForeground: '#f6f2e8',
    colorNeutral: '#39342d',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.85rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#171411] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#f6f2e8] font-semibold',
    headerSubtitle: 'text-[#aaa398]',
    socialButtonsBlockButtonText: 'text-[#f6f2e8]',
    formFieldLabel: 'text-[#eee6d5]',
    footerActionLink: 'text-[#d9b858]',
    footerActionText: 'text-[#aaa398]',
    dividerText: 'text-[#aaa398]',
    identityPreviewEditButton: 'text-[#d9b858]',
    formFieldSuccessText: 'text-[#76c99a]',
    alertText: 'text-[#f6f2e8]',
    logoBox: 'rounded-xl overflow-hidden',
    logoImage: 'w-10 h-10',
    socialButtonsBlockButton: 'border-[#39342d] bg-[#1c1915]',
    formButtonPrimary: 'bg-[#c7a44a] text-[#171411] font-semibold',
    formFieldInput: 'bg-[#100f0d] text-[#f6f2e8] border-[#39342d]',
    footerAction: 'text-[#aaa398]',
    dividerLine: 'bg-[#39342d]',
    alert: 'bg-[#381c1e] border-[#713a40]',
    otpCodeFieldInput: 'bg-[#100f0d] text-[#f6f2e8] border-[#39342d]',
    formFieldRow: 'mb-4',
    main: 'text-[#f6f2e8]',
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previous.current !== undefined && previous.current !== userId) client.clear();
      previous.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function HomeRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="public-page"><div className="auth-loading"><Brand size={42} /><div className="skeleton" style={{ width: 160, height: 12 }} /></div></div>;
  return isSignedIn ? <Redirect to="/app" /> : <Landing />;
}

function RequireSignedIn({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingPanel label="Checking secure session" />;
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

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your Bitgold account' } },
      signUp: { start: { title: 'Create your Bitgold account', subtitle: 'Join the BTG mining network' } },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <QueryClientProvider client={queryClient}>
      <ClerkQueryClientCacheInvalidator />
      <Routes />
    </QueryClientProvider>
  </ClerkProvider>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>;
}

export default App;
