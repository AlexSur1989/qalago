import { type AuthUser } from './api';
import { loadCanonicalAdminUser } from './admin-auth-session';
import { canAccessAdminWeb } from './rbac';
import { clearWebAccessToken, getWebAccessToken, setWebAccessToken } from './web-auth-token';

export type AdminAuthBootstrapResult =
  | { status: 'authenticated'; accessToken: string; user: AuthUser }
  | { status: 'unauthenticated' };

let cachedBootstrap: AdminAuthBootstrapResult | null = null;
let bootstrapInFlight: Promise<AdminAuthBootstrapResult> | null = null;
let refreshInFlight: Promise<string | null> | null = null;

/** Single-flight refresh — avoids parallel admin refresh with rotating tokens (BIZ.9 HOTFIX 6/7B). */
export async function resolveAdminAccessToken(): Promise<string | null> {
  const existing = getWebAccessToken();
  if (existing) return existing;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch('/api/auth/admin/refresh', { method: 'POST' });
        if (!res.ok) return null;
        const data = (await res.json()) as { accessToken?: string; user?: AuthUser };
        if (!data.accessToken) return null;
        if (data.user && !canAccessAdminWeb(data.user.role)) {
          return null;
        }
        setWebAccessToken(data.accessToken);
        return data.accessToken;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

/** Shared Admin Web session bootstrap for all useAuth() instances on a page. */
export function runAdminAuthBootstrap(): Promise<AdminAuthBootstrapResult> {
  if (cachedBootstrap) {
    return Promise.resolve(cachedBootstrap);
  }
  if (bootstrapInFlight) {
    return bootstrapInFlight;
  }

  bootstrapInFlight = (async (): Promise<AdminAuthBootstrapResult> => {
    const accessToken = await resolveAdminAccessToken();
    if (!accessToken) {
      return { status: 'unauthenticated' };
    }
    const loaded = await loadCanonicalAdminUser(accessToken);
    if (!loaded.ok) {
      clearWebAccessToken();
      return { status: 'unauthenticated' };
    }
    return { status: 'authenticated', accessToken, user: loaded.user };
  })();

  return bootstrapInFlight.then((result) => {
    if (result.status === 'authenticated') {
      cachedBootstrap = result;
    }
    bootstrapInFlight = null;
    return result;
  });
}

export function resetAdminAuthBootstrapState(): void {
  cachedBootstrap = null;
  bootstrapInFlight = null;
  refreshInFlight = null;
}
