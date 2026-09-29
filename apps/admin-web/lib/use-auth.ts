'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/lib/api';
import { canAccessAdminWeb } from '@/lib/rbac';
import {
  clearAdminAuthSession,
  loadCanonicalAdminUser,
} from '@/lib/admin-auth-session';
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
      async function rejectSession() {
        clearWebAccessToken();
        await clearAdminAuthSession();
        router.replace(redirectTo);
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
          if (!canAccessAdminWeb(data.user.role)) {
            await rejectSession();
            return;
          }
          access = data.accessToken;
          setWebAccessToken(access);
        } catch {
          router.replace(redirectTo);
          return;
        }
      }

      setToken(access);
      const loaded = await loadCanonicalAdminUser(access);
      if (!loaded.ok) {
        await rejectSession();
        return;
      }
      setUser(loaded.user);
      setReady(true);
    }

    void bootstrap();
  }, [router, redirectTo]);

  async function logout() {
    clearWebAccessToken();
    await clearAdminAuthSession();
    router.push('/login');
  }

  return { token, user, ready, logout };
}
