import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTE_LOCALE_HEADER } from '@/lib/locale-path';
import {
  joinRedirectTarget,
  resolveMiddlewareLocaleRedirect,
} from '@/lib/middleware-public-locale-redirect';

/** Browsers request /favicon.ico — rewrite to App Router icon (avoids dynamic segment capture). */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/icon', request.url));
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
    return NextResponse.redirect(url, 308);
  }

  if (decision.routeLocale) {
    const response = NextResponse.next();
    response.headers.set(ROUTE_LOCALE_HEADER, decision.routeLocale);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/favicon.ico',
    '/((?!_next/static|_next/image|icon|robots.txt|sitemap.xml).*)',
  ],
};
