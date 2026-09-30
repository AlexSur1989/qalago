'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, MyBusinessItem, ownerApi } from '@/lib/api';
import {
  resetBusinessAuthBootstrapState,
  runBusinessAuthBootstrap,
} from '@/lib/business-auth-bootstrap';
import { clearBusinessAuthSession } from '@/lib/business-auth-session';
import { hasBusinessCabinetAccess } from '@/lib/business-cabinet-access';
import { clearWebAccessToken } from '@/lib/web-auth-token';

export { hasBusinessCabinetAccess };

export function useAuth(redirectTo = '/login') {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<MyBusinessItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      async function rejectSession() {
        clearWebAccessToken();
        resetBusinessAuthBootstrapState();
        await clearBusinessAuthSession();
        if (!cancelled) {
          router.replace(redirectTo);
        }
      }

      const result = await runBusinessAuthBootstrap();
      if (cancelled) return;

      if (result.status === 'unauthenticated') {
        await rejectSession();
        return;
      }

      setToken(result.accessToken);
      setUser(result.user);
      setItems(result.items);
      setReady(true);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo]);

  async function logout() {
    clearWebAccessToken();
    resetBusinessAuthBootstrapState();
    await clearBusinessAuthSession();
    router.push('/login');
  }

  const refreshBusinesses = useCallback(async () => {
    const access = token ?? null;
    if (!access) return;
    const res = await ownerApi.listMyBusinesses(access);
    setItems(res.items);
  }, [token]);

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
