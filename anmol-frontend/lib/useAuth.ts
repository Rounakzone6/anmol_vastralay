'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AuthUserData = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  profileImage: string | null;
  gender: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: string;
};

interface AuthState {
  token: string | null;
  user: AuthUserData | null;
  isAuthenticated: boolean;
  setLogin: (token: string, user?: AuthUserData) => void;
  setLogout: () => void;
  updateUser: (user: AuthUserData) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setLogin: (token, user) => set({ token, user: user || null, isAuthenticated: true }),
      setLogout: () => set({ token: null, user: null, isAuthenticated: false }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'anmol-auth-storage', // unique name
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useAuth() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const store = useAuthStore();
  
  // Handle hydration to prevent hydration mismatch errors
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const login = useCallback((token: string, userData?: AuthUserData) => {
    store.setLogin(token, userData);
    localStorage.setItem('anmol_token', token); // For trpc headers backwards compatibility
    utils.invalidate();
  }, [store, utils]);

  const logout = useCallback(() => {
    store.setLogout();
    localStorage.removeItem('anmol_token');
    utils.invalidate();
    router.push('/');
  }, [store, utils, router]);

  const updateUser = useCallback((userData: AuthUserData) => {
    store.updateUser(userData);
  }, [store]);

  return {
    isAuthenticated: hydrated ? store.isAuthenticated : false,
    user: hydrated ? store.user : null,
    isHydrated: hydrated,
    login,
    logout,
    updateUser,
  };
}
