import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Browsers request /favicon.ico — rewrite to App Router icon (avoids [citySlug] capture). */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/icon', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/favicon.ico',
};
