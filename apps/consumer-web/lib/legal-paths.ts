/** F.7 — locale-neutral public legal routes at site root (not under /ru|kk/). */
export const PUBLIC_LEGAL_ROOT_SEGMENTS = [
  'privacy',
  'terms',
  'account-deletion',
] as const;

export type PublicLegalRootSegment = (typeof PUBLIC_LEGAL_ROOT_SEGMENTS)[number];

export function isPublicLegalRootPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 1) return false;
  return (PUBLIC_LEGAL_ROOT_SEGMENTS as readonly string[]).includes(parts[0]!);
}

export function publicLegalPath(segment: PublicLegalRootSegment): string {
  return `/${segment}`;
}
