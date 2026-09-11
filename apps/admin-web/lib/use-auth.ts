'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AuthUser } from '@/lib/api';
import { canAccessAdminWeb } from '@/lib/rbac';
import {
  clearWebAccessToken,
  getWebAccessToken,
  setWebAccessToken,
} from '@/lib/web-auth-token';

export function useAuth(redirectTo = '/login') {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
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
          if (!canAccessAdminWeb(data.user.role)) {
            await fetch('/api/auth/logout', { method: 'POST' });
            clearWebAccessToken();
            router.replace(redirectTo);
            return;
          }
          setToken(access);
          setUser(data.user);
          setReady(true);
          return;
        } catch {
          router.replace(redirectTo);
          return;
        }
      }

      setToken(access);
      adminApi
        .getMe(access)
        .then((me) => {
          if (!canAccessAdminWeb(me.role)) {
            clearWebAccessToken();
            router.replace(redirectTo);
            return;
          }
          setUser(me);
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

  return { token, user, ready, logout };
}
