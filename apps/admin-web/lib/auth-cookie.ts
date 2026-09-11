export const REFRESH_COOKIE_NAME = 'qalago_refresh';

export function refreshCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60,
  };
}
