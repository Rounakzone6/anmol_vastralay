import { useRouter } from 'next/navigation';
import { trpc } from './trpc';
import { useEffect, useState } from 'react';

export function useAuth() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('anmol_token') : null;
    setIsAuthenticated(!!token);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('anmol_token', token);
    setIsAuthenticated(true);
    // Invalidate all TRPC queries to fetch user-specific data (cart, profile)
    utils.invalidate();
  };

  const logout = () => {
    localStorage.removeItem('anmol_token');
    setIsAuthenticated(false);
    utils.invalidate();
    router.push('/');
  };

  return { isAuthenticated, login, logout };
}
