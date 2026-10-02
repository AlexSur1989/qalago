import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import {
  WEB_SESSION_COOKIE,
  WEB_SESSION_MAX_AGE_SEC,
  isValidWebSessionId,
} from './web-session-constants';

function generateWebSessionId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Stable anonymous session for ad serve + analytics on Consumer Web.
 * Stored in a first-party cookie; rotated only when missing/invalid.
 */
export async function getOrCreateWebSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(WEB_SESSION_COOKIE)?.value;
  if (isValidWebSessionId(existing)) return existing;

  const id = generateWebSessionId();
  jar.set(WEB_SESSION_COOKIE, id, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: WEB_SESSION_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === 'production',
  });
  return id;
}
