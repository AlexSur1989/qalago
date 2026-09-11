import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '@/lib/auth-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export async function POST() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    jar.delete(REFRESH_COOKIE_NAME);
    return new NextResponse(text || upstream.statusText, { status: upstream.status });
  }

  const data = JSON.parse(text) as {
    accessToken: string;
    refreshToken: string;
    user: unknown;
  };
  const secure = process.env.NODE_ENV === 'production';
  jar.set(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions(secure));

  return NextResponse.json({ accessToken: data.accessToken, user: data.user });
}
