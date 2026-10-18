import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, customFetch, setAuthTokenGetter } from '@workspace/api-client-react';

const TOKEN_KEY = 'bitgold.account.token';
const PENDING_TOKEN_KEY = 'bitgold.device.pending';

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    /* storage can be unavailable in private browsing; the session then lasts for this page only */
  }
}

// The bearer token lives in module scope so every API call can read it
// synchronously without a hook.
let activeToken: string | null = readStorage(TOKEN_KEY);
setAuthTokenGetter(() => activeToken);

function setActiveToken(token: string | null) {
  activeToken = token;
  writeStorage(TOKEN_KEY, token);
}

async function post<T>(path: string, body?: unknown, token?: string): Promise<T> {
  return customFetch<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    ...(token ? { headers: { authorization: `Bearer ${token}` } } : {}),
  });
}

type AuthState = 'anonymous' | 'pending-device' | 'signed-in';

type AuthContextValue = {
  isSignedIn: boolean;
  isPendingDevice: boolean;
  signUp: (input: { username: string; referralCode?: string }) => Promise<{ accountKey: string }>;
  signIn: (input: { username: string; key: string }) => Promise<{ deviceConflict: boolean }>;
  confirmDeviceSwitch: () => Promise<void>;
  cancelDeviceSwitch: () => void;
  rotateAccountKey: (input: { currentKey: string; newKey?: string }) => Promise<{ accountKey: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(() => (activeToken ? 'signed-in' : 'anonymous'));

  const signUp = useCallback(async ({ username, referralCode }: { username: string; referralCode?: string }) => {
    const result = await post<{ token: string; accountKey: string }>('/api/auth/signup', {
      username,
      ...(referralCode ? { referralCode } : {}),
    });
    setActiveToken(result.token);
    writeStorage(PENDING_TOKEN_KEY, null);
    queryClient.clear();
    setState('signed-in');
    return { accountKey: result.accountKey };
  }, [queryClient]);

  const signIn = useCallback(async ({ username, key }: { username: string; key: string }) => {
    try {
      const result = await post<{ token: string }>('/api/auth/login', { username, key });
      setActiveToken(result.token);
      writeStorage(PENDING_TOKEN_KEY, null);
      queryClient.clear();
      setState('signed-in');
      return { deviceConflict: false };
    } catch (error) {
      const payload = error instanceof ApiError ? (error.data as { code?: string; token?: string } | null) : null;
      if (error instanceof ApiError && error.status === 409 && payload?.code === 'DEVICE_SESSION_MISMATCH' && payload.token) {
        // The account already has an active device session: hold the pending
        // token until the switch is confirmed explicitly.
        writeStorage(PENDING_TOKEN_KEY, payload.token);
        setState('pending-device');
        return { deviceConflict: true };
      }
      throw error;
    }
  }, [queryClient]);

  const confirmDeviceSwitch = useCallback(async () => {
    const pendingToken = readStorage(PENDING_TOKEN_KEY);
    if (!pendingToken) throw new Error('This device switch expired. Please sign in again.');
    await post('/api/account/device/switch', undefined, pendingToken);
    setActiveToken(pendingToken);
    writeStorage(PENDING_TOKEN_KEY, null);
    queryClient.clear();
    setState('signed-in');
  }, [queryClient]);

  const cancelDeviceSwitch = useCallback(() => {
    writeStorage(PENDING_TOKEN_KEY, null);
    setActiveToken(null);
    setState('anonymous');
  }, []);

  const rotateAccountKey = useCallback(async ({ currentKey, newKey }: { currentKey: string; newKey?: string }) => {
    return post<{ accountKey: string }>('/api/auth/key/rotate', {
      currentKey,
      ...(newKey ? { newKey } : {}),
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await post('/api/auth/logout');
    } catch {
      /* the session may already be revoked */
    }
    setActiveToken(null);
    writeStorage(PENDING_TOKEN_KEY, null);
    queryClient.clear();
    setState('anonymous');
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => ({
    isSignedIn: state === 'signed-in',
    isPendingDevice: state === 'pending-device',
    signUp,
    signIn,
    confirmDeviceSwitch,
    cancelDeviceSwitch,
    rotateAccountKey,
    signOut,
  }), [state, signUp, signIn, confirmDeviceSwitch, cancelDeviceSwitch, rotateAccountKey, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
