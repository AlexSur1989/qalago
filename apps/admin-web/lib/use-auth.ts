'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/lib/api';
import {
  resetAdminAuthBootstrapState,
  runAdminAuthBootstrap,
} from '@/lib/admin-auth-bootstrap';
import {
  clearAdminAuthSession,
} from '@/lib/admin-auth-session';
import {
  clearWebAccessToken,
} from '@/lib/web-auth-token';

export function useAuth(redirectTo = '/login') {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      async function rejectSession() {
        clearWebAccessToken();
        resetAdminAuthBootstrapState();
        await clearAdminAuthSession();
        if (!cancelled) {
          router.replace(redirectTo);
        }
      }

      const result = await runAdminAuthBootstrap();
      if (cancelled) return;

      if (result.status === 'unauthenticated') {
        await rejectSession();
        return;
      }

      setToken(result.accessToken);
      setUser(result.user);
      setReady(true);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo]);

  async function logout() {
    clearWebAccessToken();
    resetAdminAuthBootstrapState();
    await clearAdminAuthSession();
    router.push('/login');
  }

  return { token, user, ready, logout };
}
