'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, MyBusinessItem, ownerApi } from '@/lib/api';
import {
  clearBusinessAuthSession,
  loadCanonicalBusinessUser,
} from '@/lib/business-auth-session';
import { hasBusinessCabinetAccess } from '@/lib/business-cabinet-access';
import {
  clearWebAccessToken,
  getWebAccessToken,
  setWebAccessToken,
} from '@/lib/web-auth-token';

export { hasBusinessCabinetAccess };

export function useAuth(redirectTo = '/login') {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<MyBusinessItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      async function rejectSession() {
        clearWebAccessToken();
        await clearBusinessAuthSession();
        router.replace(redirectTo);
      }

      async function completeBootstrap(access: string) {
        const loaded = await loadCanonicalBusinessUser(access);
        if (!loaded.ok) {
          await rejectSession();
          return;
        }
        setToken(access);
        setUser(loaded.user);
        const res = await ownerApi.listMyBusinesses(access);
        setItems(res.items);
        setReady(true);
      }

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
          await completeBootstrap(access);
        } catch {
          router.replace(redirectTo);
        }
        return;
      }

      await completeBootstrap(access);
    }

    void bootstrap();
  }, [router, redirectTo]);

  async function logout() {
    clearWebAccessToken();
    await clearBusinessAuthSession();
    router.push('/login');
  }

  const refreshBusinesses = useCallback(async () => {
    const access = getWebAccessToken();
    if (!access) return;
    const res = await ownerApi.listMyBusinesses(access);
    setItems(res.items);
  }, []);

  return {
    token,
    user,
    items,
    businesses: items,
    ready,
    logout,
    refreshBusinesses,
  };
}
