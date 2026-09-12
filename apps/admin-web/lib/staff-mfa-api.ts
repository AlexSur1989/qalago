const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

async function mfaFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || res.statusText);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export type StaffMfaStatus = {
  enabled: boolean;
  method: 'TOTP' | null;
  enabledAt: string | null;
  recoveryCodesRemaining: number;
  requiresMfa: boolean;
  enrollmentRequired: boolean;
};

export function fetchStaffMfaStatus(token: string) {
  return mfaFetch<StaffMfaStatus>('/auth/staff/mfa/status', token);
}

export function startStaffMfaEnroll(token: string) {
  return mfaFetch<{ otpauthUri: string; secret: string; pendingExpiresAt: string }>(
    '/auth/staff/mfa/enroll/start',
    token,
    { method: 'POST', body: '{}' },
  );
}

export function verifyStaffMfaEnroll(token: string, totp: string) {
  return mfaFetch<{ enabled: boolean; recoveryCodes: string[]; accessToken?: string }>(
    '/auth/staff/mfa/enroll/verify',
    token,
    { method: 'POST', body: JSON.stringify({ totp }) },
  );
}

export async function verifyStaffMfaLogin(input: {
  mfaChallengeToken: string;
  totp?: string;
  recoveryCode?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/staff/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return JSON.parse(text) as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; role: string; phone?: string; name?: string };
  };
}
