// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Hook to read the auth context
// TODO: Nothing more needed unless the context shape changes

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthProvider.js';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
