/** Minimal cookie jar surface used by auth BFF routes. */
export type AuthCookieJar = {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: Record<string, unknown>) => void;
  delete: (options: { name: string; path: string }) => void;
};

export const REFRESH_COOKIE_NAME = 'qalago_admin_refresh';
export const REFRESH_COOKIE_PATH = '/api/auth/admin';

/** Retired shared browser cookie (BIZ.9 HOTFIX 7B) — cleared on auth mutations, never read. */
export const LEGACY_REFRESH_COOKIE_NAME = 'qalago_refresh';
export const LEGACY_REFRESH_COOKIE_PATH = '/api/auth';

export function refreshCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: 30 * 24 * 60 * 60,
  };
}

export function clearLegacyRefreshCookie(jar: AuthCookieJar): void {
  jar.delete({ name: LEGACY_REFRESH_COOKIE_NAME, path: LEGACY_REFRESH_COOKIE_PATH });
}

export function clearAppRefreshCookie(jar: AuthCookieJar): void {
  jar.delete({ name: REFRESH_COOKIE_NAME, path: REFRESH_COOKIE_PATH });
}

export function persistRefreshToken(jar: AuthCookieJar, refreshToken: string, secure: boolean): void {
  jar.set(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(secure));
  clearLegacyRefreshCookie(jar);
}
