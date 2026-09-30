import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { persistRefreshToken } from '@/lib/auth-cookie';

/** Sets HttpOnly refresh cookie after a client-side auth exchange (e.g. social login). */
export async function POST(request: Request) {
  const body = (await request.json()) as { refreshToken?: string };
  if (!body.refreshToken || body.refreshToken.length < 20) {
    return NextResponse.json({ message: 'refreshToken required' }, { status: 400 });
  }
  const secure = process.env.NODE_ENV === 'production';
  const jar = await cookies();
  persistRefreshToken(jar, body.refreshToken, secure);
  return NextResponse.json({ success: true });
}
