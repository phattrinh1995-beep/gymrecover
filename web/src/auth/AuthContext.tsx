import React, { useEffect, useState } from 'react';
import type { AuthUser } from '../types';
import { AuthContext } from './authContextValue';

/**
 * DEV-ONLY AUTH — same rationale and limitations as mobile/src/auth/AuthContext.tsx: no real
 * Auth0 tenant is provisioned yet. This is a fake local "login" (email only, no verification).
 * The backend's matching dev-bypass is hard-disabled outside development
 * (see backend/src/auth/jwt-auth.guard.ts).
 */

const STORAGE_KEY = 'gymrecover.providerPortal.devAuthUser';

function subFromEmail(email: string): string {
  return `dev|${email.trim().toLowerCase()}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = (email: string) => setUser({ sub: subFromEmail(email), email: email.trim().toLowerCase() });
  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
