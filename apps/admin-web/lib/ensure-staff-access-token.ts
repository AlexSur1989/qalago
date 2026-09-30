import { resolveAdminAccessToken } from '@/lib/admin-auth-bootstrap';

/** Restore in-memory access token from HttpOnly refresh cookie (same tab or hard refresh). */
export async function ensureStaffAccessToken(): Promise<string | null> {
  return resolveAdminAccessToken();
}
