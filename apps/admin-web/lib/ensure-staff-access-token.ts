import { getWebAccessToken, setWebAccessToken } from '@/lib/web-auth-token';

/** Restore in-memory access token from HttpOnly refresh cookie (same tab or new navigation). */
export async function ensureStaffAccessToken(): Promise<string | null> {
  const existing = getWebAccessToken();
  if (existing) return existing;

  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken?: string };
    if (!data.accessToken) return null;
    setWebAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}
