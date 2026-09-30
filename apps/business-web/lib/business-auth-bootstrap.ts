import { type AuthUser, type MyBusinessItem, ownerApi } from './api';
import { loadCanonicalBusinessUser } from './business-auth-session';
import { clearWebAccessToken, getWebAccessToken, setWebAccessToken } from './web-auth-token';

export type BusinessAuthBootstrapResult =
  | { status: 'authenticated'; accessToken: string; user: AuthUser; items: MyBusinessItem[] }
  | { status: 'unauthenticated' };

let cachedBootstrap: BusinessAuthBootstrapResult | null = null;
let bootstrapInFlight: Promise<BusinessAuthBootstrapResult> | null = null;
let refreshInFlight: Promise<string | null> | null = null;

/** Single-flight refresh — BIZ.9 HOTFIX 7B (same-origin parallel callers). */
export async function resolveBusinessAccessToken(): Promise<string | null> {
  const existing = getWebAccessToken();
  if (existing) return existing;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch('/api/auth/business/refresh', { method: 'POST' });
        if (!res.ok) return null;
        const data = (await res.json()) as { accessToken?: string };
        if (!data.accessToken) return null;
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

export function runBusinessAuthBootstrap(): Promise<BusinessAuthBootstrapResult> {
  if (cachedBootstrap) {
    return Promise.resolve(cachedBootstrap);
  }
  if (bootstrapInFlight) {
    return bootstrapInFlight;
  }

  bootstrapInFlight = (async (): Promise<BusinessAuthBootstrapResult> => {
    const accessToken = await resolveBusinessAccessToken();
    if (!accessToken) {
      return { status: 'unauthenticated' };
    }
    const loaded = await loadCanonicalBusinessUser(accessToken);
    if (!loaded.ok) {
      clearWebAccessToken();
      return { status: 'unauthenticated' };
    }
    const res = await ownerApi.listMyBusinesses(accessToken);
    return {
      status: 'authenticated',
      accessToken,
      user: loaded.user,
      items: res.items,
    };
  })();

  return bootstrapInFlight.then((result) => {
    if (result.status === 'authenticated') {
      cachedBootstrap = result;
    }
    bootstrapInFlight = null;
    return result;
  });
}

export function resetBusinessAuthBootstrapState(): void {
  cachedBootstrap = null;
  bootstrapInFlight = null;
  refreshInFlight = null;
}
