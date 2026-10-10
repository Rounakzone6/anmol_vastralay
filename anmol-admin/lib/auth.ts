'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const TOKEN_KEY = 'anmol_admin_token';
const COOKIE_NAME = 'admin_token';

interface AdminAuthState {
  token: string | null;
  setTokenState: (token: string) => void;
  clearTokenState: () => void;
}

const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      setTokenState: (token) => set({ token }),
      clearTokenState: () => set({ token: null }),
    }),
    {
      name: 'anmol-admin-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  // Update zustand store if called directly
  useAdminAuthStore.getState().setTokenState(token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  // Update zustand store if called directly
  useAdminAuthStore.getState().clearTokenState();
}
