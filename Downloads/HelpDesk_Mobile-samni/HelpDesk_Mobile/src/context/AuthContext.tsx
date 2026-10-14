// Login state for one app. Each app (customer, provider, admin) wraps itself in its own
// <AuthProvider scope="..."> so Dual View can show a customer and a provider logged in
// at the same time. The token is kept in localStorage under the scope's key.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ProviderProfile, User, UserRole } from '../types';
import { ApiRequestError, createApiClient, type ApiClient } from '../services/api';

export type AuthScope = 'customer' | 'provider' | 'admin';

const SCOPE_ROLE: Record<AuthScope, UserRole> = { customer: 'CUSTOMER', provider: 'PROVIDER', admin: 'ADMIN' };

interface AuthContextValue {
  scope: AuthScope;
  user: User | null;
  providerProfile: ProviderProfile | null;
  /** True until the saved token has been checked. */
  loading: boolean;
  api: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  register: (body: { fullName: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  /** Re-read the user and provider profile from the server. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function storageKey(scope: AuthScope) {
  return `helpdesk.token.${scope}`;
}

function readToken(scope: AuthScope): string | null {
  try {
    return localStorage.getItem(storageKey(scope));
  } catch {
    return null;
  }
}

function writeToken(scope: AuthScope, token: string | null) {
  try {
    if (token) localStorage.setItem(storageKey(scope), token);
    else localStorage.removeItem(storageKey(scope));
  } catch {
    // Private mode / storage blocked: the session just won't survive a reload.
  }
}

export function AuthProvider({ scope, children }: { scope: AuthScope; children: ReactNode }) {
  const tokenRef = useRef<string | null>(readToken(scope));
  const [user, setUser] = useState<User | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenRef.current));

  const api = useMemo(() => createApiClient(() => tokenRef.current), []);

  const setToken = useCallback(
    (token: string | null) => {
      tokenRef.current = token;
      writeToken(scope, token);
    },
    [scope],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setProviderProfile(null);
  }, [setToken]);

  const refresh = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const me = await api.auth.me();
      setUser(me.user);
      setProviderProfile(me.providerProfile);
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 403)) logout();
    }
  }, [api, logout]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.auth.login(email, password);
      if (res.user.role !== SCOPE_ROLE[scope]) {
        const where = { CUSTOMER: 'customer app', PROVIDER: 'provider app', ADMIN: 'admin dashboard' }[res.user.role];
        throw new ApiRequestError(403, `This is a ${res.user.role.toLowerCase()} account. Use the ${where} instead.`);
      }
      setToken(res.token);
      setUser(res.user);
      await refresh();
    },
    [api, scope, setToken, refresh],
  );

  const register = useCallback(
    async (body: { fullName: string; email: string; password: string; phone?: string }) => {
      const role = SCOPE_ROLE[scope];
      if (role === 'ADMIN') throw new ApiRequestError(403, 'Admin accounts are created by HelpDesk staff');
      const res = await api.auth.register({ ...body, role });
      setToken(res.token);
      setUser(res.user);
      await refresh();
    },
    [api, scope, setToken, refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ scope, user, providerProfile, loading, api, login, register, logout, refresh }),
    [scope, user, providerProfile, loading, api, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
