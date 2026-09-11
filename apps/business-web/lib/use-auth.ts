'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, MyBusinessItem, ownerApi } from '@/lib/api';
import {
  clearWebAccessToken,
  getWebAccessToken,
  setWebAccessToken,
} from '@/lib/web-auth-token';

export function useAuth(redirectTo = '/login') {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<MyBusinessItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      let access = getWebAccessToken();
      if (!access) {
        try {
          const res = await fetch('/api/auth/refresh', { method: 'POST' });
          if (!res.ok) {
            router.replace(redirectTo);
            return;
          }
          const data = (await res.json()) as { accessToken: string; user: AuthUser };
          access = data.accessToken;
          setWebAccessToken(access);
          setToken(access);
          setUser(data.user);
          const businesses = await ownerApi.listMyBusinesses(access);
          setItems(businesses.items);
          setReady(true);
          return;
        } catch {
          router.replace(redirectTo);
          return;
        }
      }

      setToken(access);
      ownerApi
        .getMe(access)
        .then(async (me) => {
          setUser(me);
          const res = await ownerApi.listMyBusinesses(access!);
          setItems(res.items);
        })
        .catch(async () => {
          clearWebAccessToken();
          router.replace(redirectTo);
        })
        .finally(() => setReady(true));
    }

    void bootstrap();
  }, [router, redirectTo]);

  async function logout() {
    clearWebAccessToken();
    await fetch('/api/auth/logout', { method: 'POST' });
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
