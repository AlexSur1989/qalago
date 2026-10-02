import type { NextRequest, NextResponse } from 'next/server';
import {
  WEB_SESSION_COOKIE,
  WEB_SESSION_MAX_AGE_SEC,
  WEB_SESSION_REQUEST_HEADER,
  isValidWebSessionId,
} from './web-session-constants';

function generateWebSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function resolveWebSessionId(request: NextRequest): {
  sessionId: string;
  shouldSetCookie: boolean;
} {
  const existing = request.cookies.get(WEB_SESSION_COOKIE)?.value;
  if (isValidWebSessionId(existing)) {
    return { sessionId: existing, shouldSetCookie: false };
  }
  return { sessionId: generateWebSessionId(), shouldSetCookie: true };
}

export function requestHeadersWithWebSession(
  request: NextRequest,
  sessionId: string,
): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(WEB_SESSION_REQUEST_HEADER, sessionId);
  return requestHeaders;
}

export function setWebSessionCookieOnResponse(response: NextResponse, sessionId: string): void {
  response.cookies.set(WEB_SESSION_COOKIE, sessionId, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: WEB_SESSION_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === 'production',
  });
}
