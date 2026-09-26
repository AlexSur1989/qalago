import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTE_LOCALE_HEADER } from '@/lib/locale-path';
import { isSupportedPublicLocale } from '@/lib/public-locale';

/** Browsers request /favicon.ico — rewrite to App Router icon (avoids dynamic segment capture). */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/icon', request.url));
  }

  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0];
  if (first && isSupportedPublicLocale(first)) {
    const response = NextResponse.next();
    response.headers.set(ROUTE_LOCALE_HEADER, first);
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
