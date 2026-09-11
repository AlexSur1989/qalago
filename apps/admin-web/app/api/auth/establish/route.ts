import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '@/lib/auth-cookie';

export async function POST(request: Request) {
  const body = (await request.json()) as { refreshToken?: string };
  if (!body.refreshToken || body.refreshToken.length < 20) {
    return NextResponse.json({ message: 'refreshToken required' }, { status: 400 });
  }
  const secure = process.env.NODE_ENV === 'production';
  const jar = await cookies();
  jar.set(REFRESH_COOKIE_NAME, body.refreshToken, refreshCookieOptions(secure));
  return NextResponse.json({ success: true });
}
