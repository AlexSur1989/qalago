/** Safe internal redirect paths for Business Web (login/invite flows). */
export function sanitizeInternalRedirect(
  raw: string | null | undefined,
  fallback = '/dashboard',
): string | null {
  if (!raw) return null;

  const value = raw.trim();
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//')) return null;
  if (value.includes('://')) return null;
  if (value.toLowerCase().startsWith('javascript:')) return null;

  if (value === '/login') return fallback;
  return value;
}
