import { adminApi, type AuthUser } from './api';
import { canAccessAdminWeb } from './rbac';

/** Canonical Admin Web staff profile — always derived from GET /users/me (AOP.7H.3). */
export function normalizeAdminAuthUser(raw: AuthUser): AuthUser {
  const managedCity = raw.managedCity
    ? {
        ...raw.managedCity,
        id: raw.managedCity.id ?? undefined,
      }
    : raw.managedCity;
  const managedCityId =
    raw.managedCityId ?? (managedCity?.id ? managedCity.id : null) ?? null;
  return {
    ...raw,
    managedCity,
    managedCityId,
  };
}

export type LoadCanonicalAdminUserResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: 'forbidden' | 'me_failed' };

/**
 * Load staff profile after any successful access-token issuance.
 * Refresh/login payloads alone are not canonical for CITY_ADMIN scope.
 */
export async function loadCanonicalAdminUser(
  accessToken: string,
  getMe: (token: string) => Promise<AuthUser> = adminApi.getMe.bind(adminApi),
): Promise<LoadCanonicalAdminUserResult> {
  try {
    const me = await getMe(accessToken);
    if (!canAccessAdminWeb(me.role)) {
      return { ok: false, reason: 'forbidden' };
    }
    return { ok: true, user: normalizeAdminAuthUser(me) };
  } catch {
    return { ok: false, reason: 'me_failed' };
  }
}

export async function clearAdminAuthSession(): Promise<void> {
  await fetch('/api/auth/admin/logout', { method: 'POST' }).catch(() => undefined);
}
