import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTE_LOCALE_HEADER } from '@/lib/locale-path';
import {
  joinRedirectTarget,
  resolveMiddlewareLocaleRedirect,
} from '@/lib/middleware-public-locale-redirect';
import { isWellKnownAssociationPath } from '@/lib/well-known-path';
import {
  requestHeadersWithWebSession,
  resolveWebSessionId,
  setWebSessionCookieOnResponse,
} from '@/lib/web-session-middleware';

/** Browsers request /favicon.ico — rewrite to App Router icon (avoids dynamic segment capture). */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { sessionId, shouldSetCookie } = resolveWebSessionId(request);

  if (isWellKnownAssociationPath(pathname)) {
    const response = NextResponse.next();
    if (shouldSetCookie) setWebSessionCookieOnResponse(response, sessionId);
    return response;
  }

  if (pathname === '/favicon.ico') {
    const response = NextResponse.rewrite(new URL('/icon', request.url));
    if (shouldSetCookie) setWebSessionCookieOnResponse(response, sessionId);
    return response;
  }

  const decision = resolveMiddlewareLocaleRedirect(
    pathname,
    request.nextUrl.searchParams,
    request.headers.get('cookie'),
  );

  if (decision.kind === 'permanent') {
    const target = joinRedirectTarget(decision.pathname, decision.search);
    const url = new URL(target, request.url);
    if (url.origin !== request.nextUrl.origin) {
      return NextResponse.next();
    }
    const redirect = NextResponse.redirect(url, 308);
    if (shouldSetCookie) setWebSessionCookieOnResponse(redirect, sessionId);
    return redirect;
  }

  const requestHeaders = requestHeadersWithWebSession(request, sessionId);

  if (decision.routeLocale) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set(ROUTE_LOCALE_HEADER, decision.routeLocale);
    if (shouldSetCookie) setWebSessionCookieOnResponse(response, sessionId);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (shouldSetCookie) setWebSessionCookieOnResponse(response, sessionId);
  return response;
}

export const config = {
  matcher: [
    '/favicon.ico',
    '/((?!_next/static|_next/image|icon|robots.txt|sitemap.xml).*)',
  ],
};
