import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { persistRefreshToken } from '@/lib/auth-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export async function POST(request: Request) {
  const body = await request.json();
  const path =
    body.mode === 'dev' ? '/auth/dev-login' : '/auth/verify-code';
  const payload =
    body.mode === 'dev'
      ? { phone: body.phone }
      : { phone: body.phone, code: body.code };

  const upstream = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return new NextResponse(text || upstream.statusText, { status: upstream.status });
  }

  const data = JSON.parse(text) as {
    accessToken?: string;
    refreshToken?: string;
    user: unknown;
    mfaRequired?: boolean;
    mfaChallengeToken?: string;
    enrollmentRequired?: boolean;
  };

  if (data.mfaRequired && data.mfaChallengeToken) {
    return NextResponse.json({
      mfaRequired: true,
      mfaChallengeToken: data.mfaChallengeToken,
      user: data.user,
    });
  }

  if (!data.accessToken || !data.refreshToken) {
    return new NextResponse('Incomplete auth response', { status: 502 });
  }

  const secure = process.env.NODE_ENV === 'production';
  const jar = await cookies();
  persistRefreshToken(jar, data.refreshToken, secure);

  return NextResponse.json({
    accessToken: data.accessToken,
    user: data.user,
    enrollmentRequired: data.enrollmentRequired === true,
  });
}
