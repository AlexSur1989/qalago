import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { persistRefreshToken } from '@/lib/auth-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export async function POST(request: Request) {
  const body = await request.json();
  const upstream = await fetch(`${API_BASE}/auth/staff/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await upstream.text();
  if (!upstream.ok) {
    return new NextResponse(text || upstream.statusText, { status: upstream.status });
  }
  const data = JSON.parse(text) as {
    accessToken: string;
    refreshToken: string;
    user: unknown;
  };
  const secure = process.env.NODE_ENV === 'production';
  const jar = await cookies();
  persistRefreshToken(jar, data.refreshToken, secure);
  return NextResponse.json({ accessToken: data.accessToken, user: data.user });
}
