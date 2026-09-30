import { createContext } from 'react';
import type { AuthUser } from '../types';

export interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
