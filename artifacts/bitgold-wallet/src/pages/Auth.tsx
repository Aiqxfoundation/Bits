import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Check, Copy, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Brand, InlineNotice, apiErrorMessage } from '@/components/common';

function AuthFrame({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  return <main className="auth-page">
    <div className="auth-aside">
      <Link href="/" className="brand-link"><Brand size={34} /><strong>Bitgold</strong></Link>
      <div className="auth-aside-copy"><div className="eyebrow">The network begins with you</div><h2>Earn in the<br /><em>gold standard.</em></h2><p>Mine BTG. Build your team. Keep your account under your control.</p></div>
      <div className="auth-aside-foot"><ShieldCheck size={16} /> Account keys are generated on the Bitgold server and stored hashed.</div>
    </div>
    <div className="auth-main">
      <Link href="/" className="back-home"><ArrowLeft size={15} /> Back to Bitgold</Link>
      <div className="auth-card">
        <div className="auth-mobile-brand"><Brand size={38} /><span>Bitgold</span></div>
        <div className="eyebrow">BITGOLD ACCOUNT</div><h1>{title}</h1><p className="muted">{subtitle}</p>
        {children}
      </div>
      <div className="auth-privacy">By continuing, you agree to the <Link href="/privacy">privacy notice</Link>, including our public IP collection and single-active-device rule.</div>
    </div>
  </main>;
}

export function SignUpPage() {
  const [, setLocation] = useLocation();
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accountKey, setAccountKey] = useState('');
  const [copied, setCopied] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const referralCode = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase();
      const result = await signUp({ username: username.trim(), ...(referralCode ? { referralCode } : {}) });
      setAccountKey(result.accountKey);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'We could not create your account. Check your username and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(accountKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const saveKey = () => {
    const blob = new Blob([`Bitgold account key\nUsername: ${username.trim()}\n\n${accountKey}\n\nKeep this key private. Bitgold will not show it again.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bitgold-account-key-${username.trim()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const finish = () => {
    setAccountKey('');
    setLocation('/app');
  };

  return <AuthFrame title={accountKey ? 'Save your account key' : 'Create your account'} subtitle={accountKey ? 'This key is your password credential. We cannot recover it for you.' : 'Choose a username. We will generate a private account key for you.'}>
    {!accountKey && <form onSubmit={submit} className="auth-form">
      {error && <InlineNotice tone="danger">{error}</InlineNotice>}
      <label className="field-label" htmlFor="signup-username">Username</label>
      <input id="signup-username" className="field auth-field" autoComplete="username" minLength={3} maxLength={32} pattern="[A-Za-z0-9_.-]+" required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" data-testid="input-signup-username" />
      <div className="account-key-preview"><KeyRound size={17} /><div><strong>Private account key</strong><span>Generated at signup · stored only as a salted hash</span></div><LockKeyhole size={15} /></div>
      <button className="button gold auth-submit" type="submit" disabled={busy} data-testid="button-create-account">
        {busy ? <><LoaderCircle className="spin" size={16} /> Creating secure account…</> : <>Create account <span>→</span></>}
      </button>
      <p className="auth-form-note">No email or phone number required. The key is shown once after signup.</p>
    </form>}
    {accountKey && <div className="auth-form">
      <InlineNotice tone="success">Account created. Save this key now; it will not be displayed again.</InlineNotice>
      <label className="field-label">Your account key</label>
      <div className="key-reveal"><code>{accountKey}</code><button onClick={copyKey} className="icon-button" aria-label="Copy account key" data-testid="button-copy-account-key">{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>
      <div className="key-action-row"><button className="button" onClick={saveKey} data-testid="button-download-account-key">Download key</button><button className="button gold" onClick={finish} data-testid="button-continue-after-signup">I saved my key</button></div>
      <p className="auth-form-note">Store it somewhere safe. Anyone with this key can access your Bitgold account.</p>
    </div>}
    {!accountKey && <p className="auth-switch">Already have an account? <Link href="/sign-in">Sign in</Link></p>}
  </AuthFrame>;
}

export function SignInPage() {
  const [, setLocation] = useLocation();
  const { signIn, confirmDeviceSwitch, cancelDeviceSwitch } = useAuth();
  const [username, setUsername] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deviceConflict, setDeviceConflict] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await signIn({ username: username.trim(), key });
      if (result.deviceConflict) setDeviceConflict(true);
      else setLocation('/app');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'The username or account key was not accepted.'));
    } finally {
      setBusy(false);
    }
  };

  const confirmSwitch = async () => {
    setBusy(true);
    setError('');
    try {
      await confirmDeviceSwitch();
      setLocation('/app');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'This device could not be activated. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const dismissConflict = () => {
    cancelDeviceSwitch();
    setDeviceConflict(false);
  };

  return <AuthFrame title="Welcome back" subtitle="Sign in with your username and private account key.">
    <form onSubmit={submit} className="auth-form">
      {error && <InlineNotice tone="danger">{error}</InlineNotice>}
      <label className="field-label" htmlFor="signin-username">Username</label>
      <input id="signin-username" className="field auth-field" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Your username" data-testid="input-signin-username" />
      <label className="field-label" htmlFor="signin-key">Account key</label>
      <input id="signin-key" className="field auth-field mono" type="password" autoComplete="current-password" required value={key} onChange={(event) => setKey(event.target.value)} placeholder="Paste your account key" data-testid="input-signin-key" />
      <button className="button gold auth-submit" type="submit" disabled={busy} data-testid="button-sign-in">
        {busy ? <><LoaderCircle className="spin" size={16} /> Verifying…</> : <>Sign in <span>→</span></>}
      </button>
      <p className="auth-form-note"><LockKeyhole size={13} /> Your key is verified against a salted hash on the Bitgold server.</p>
    </form>
    <p className="auth-switch">New to Bitgold? <Link href="/sign-up">Create an account</Link></p>
    {deviceConflict && <div className="dialog-backdrop">
      <section className="dialog-card device-dialog" role="alertdialog" aria-modal="true">
        <div className="device-icon"><LockKeyhole size={22} /></div><h2>Switch active device?</h2>
        <p className="muted">This account is active on another device. Confirming will move the account's single active session to this device.</p>
        {error && <InlineNotice tone="danger">{error}</InlineNotice>}
        <div className="key-action-row"><button className="button" onClick={dismissConflict} data-testid="button-cancel-device-switch">Cancel</button><button className="button gold" onClick={confirmSwitch} disabled={busy} data-testid="button-confirm-device-switch">{busy ? 'Switching…' : 'Switch to this device'}</button></div>
      </section>
    </div>}
  </AuthFrame>;
}
