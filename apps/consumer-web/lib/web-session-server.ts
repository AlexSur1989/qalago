import { cookies, headers } from 'next/headers';
import {
  WEB_SESSION_COOKIE,
  WEB_SESSION_REQUEST_HEADER,
  isValidWebSessionId,
} from './web-session-constants';

/**
 * Stable anonymous session for ad serve + analytics on Consumer Web.
 * Cookie is created in middleware; RSC must not mutate cookies (Next.js 15).
 */
export async function getOrCreateWebSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(WEB_SESSION_COOKIE)?.value;
  if (isValidWebSessionId(existing)) return existing;

  const fromMiddleware = (await headers()).get(WEB_SESSION_REQUEST_HEADER);
  if (isValidWebSessionId(fromMiddleware)) return fromMiddleware;

  throw new Error(
    'Missing web session: ensure consumer-web middleware applies qalago_web_session',
  );
}
