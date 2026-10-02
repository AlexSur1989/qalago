export {
  WEB_SESSION_COOKIE,
  WEB_SESSION_MAX_AGE_SEC,
  isValidWebSessionId,
} from './web-session-constants';

/** Test helper — mirrors server generator without node:crypto in client bundles. */
export function generateWebSessionIdForTests(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
