// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: React context that holds the logged-in user and JWT for all three frontends
// TODO: Implement login/register/logout with the auth API and restore the token from storage on start

import { createContext, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../types/user.js';

/** Where the token is kept: SecureStore on mobile, localStorage on web. */
export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  storage?: TokenStorage;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user] = useState<User | null>(null);
  const [token] = useState<string | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading: false,
      login: async () => {
        throw new Error('AuthProvider.login is not implemented yet');
      },
      logout: async () => {
        throw new Error('AuthProvider.logout is not implemented yet');
      },
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
