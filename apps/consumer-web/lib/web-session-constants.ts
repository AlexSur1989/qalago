/** Cookie name for anonymous web ad/analytics session (not user identity). */
export const WEB_SESSION_COOKIE = 'qalago_web_session';

/** 30 days — aligned with typical analytics session retention. */
export const WEB_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

const SESSION_RE = /^[a-f0-9]{32}$/;

export function isValidWebSessionId(value: string | undefined | null): value is string {
  return typeof value === 'string' && SESSION_RE.test(value);
}
