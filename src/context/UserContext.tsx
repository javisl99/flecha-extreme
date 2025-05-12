'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useUser } from '@/hooks/useUser';
import { User, Session } from '@supabase/supabase-js';

type LoginResponse = {
  success: boolean;
  error?: string;
};

type UserContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<LoginResponse>;
  isAuthenticated: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const userAuth = useUser();

  return <UserContext.Provider value={userAuth}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext debe ser usado dentro de un UserProvider');
  }
  return context;
} 