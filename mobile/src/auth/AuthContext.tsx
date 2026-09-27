import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '../types';

/**
 * DEV-ONLY AUTH
 * =============
 * No real Auth0 tenant has been provisioned for this project (see backend/.env). Real Auth0
 * integration (react-native-auth0, universal login) needs a tenant/application created in an
 * Auth0 dashboard, which requires account access this build doesn't have. Until then, this
 * context does a fake local "login" (just an email/name form, no password, no verification) and
 * synthesizes a stable `sub` from the email so the same person always maps to the same backend
 * User row. The backend's matching dev-bypass is hard-disabled outside development
 * (see backend/src/auth/jwt-auth.guard.ts) so this pairing can't leak into a real deployment
 * without both sides being deliberately re-enabled.
 */

const STORAGE_KEY = 'gymrecover.devAuthUser';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function subFromEmail(email: string): string {
  return `dev|${email.trim().toLowerCase()}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string) => {
    const nextUser: AuthUser = { sub: subFromEmail(email), email: email.trim().toLowerCase() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
