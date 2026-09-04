'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AuthUser, TOKEN_KEY } from '@/lib/api';

export function useAuth(redirectTo = '/login') {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      router.replace(redirectTo);
      return;
    }
    setToken(t);
    adminApi
      .getMe(t)
      .then((me) => {
        if (me.role !== 'ADMIN' && me.role !== 'CITY_ADMIN') {
          localStorage.removeItem(TOKEN_KEY);
          router.replace(redirectTo);
          return;
        }
        setUser(me);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        router.replace(redirectTo);
      })
      .finally(() => setReady(true));
  }, [router, redirectTo]);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    router.push('/login');
  }

  return { token, user, ready, logout };
}
