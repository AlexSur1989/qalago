import { ownerApi, type AuthUser } from './api';

/** Canonical Business Web profile — always derived from GET /users/me (BIZ.2). */
export function normalizeBusinessAuthUser(raw: AuthUser): AuthUser {
  return { ...raw };
}

export type LoadCanonicalBusinessUserResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: 'me_failed' };

/**
 * Load authenticated user after any successful access-token issuance.
 * Refresh/login payloads alone are not canonical.
 */
export async function loadCanonicalBusinessUser(
  accessToken: string,
  getMe: (token: string) => Promise<AuthUser> = ownerApi.getMe.bind(ownerApi),
): Promise<LoadCanonicalBusinessUserResult> {
  try {
    const me = await getMe(accessToken);
    return { ok: true, user: normalizeBusinessAuthUser(me) };
  } catch {
    return { ok: false, reason: 'me_failed' };
  }
}

export async function clearBusinessAuthSession(): Promise<void> {
  await fetch('/api/auth/business/logout', { method: 'POST' }).catch(() => undefined);
}
