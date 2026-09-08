'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, MyBusinessItem, ownerApi, TOKEN_KEY } from '@/lib/api';

export function useAuth(redirectTo = '/login') {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<MyBusinessItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      router.replace(redirectTo);
      return;
    }
    setToken(t);
    ownerApi
      .getMe(t)
      .then(async (me) => {
        setUser(me);
        const res = await ownerApi.listMyBusinesses(t);
        setItems(res.items);
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

  return {
    token,
    user,
    items,
    businesses: items,
    ready,
    logout,
  };
}

/** True when user can open business cabinet (legacy role or active membership). */
export function hasBusinessCabinetAccess(
  user: AuthUser | null,
  items: MyBusinessItem[],
): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'CITY_ADMIN' || user.role === 'BUSINESS') {
    return true;
  }
  return items.length > 0;
}
