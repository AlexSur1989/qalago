/** F.7 — locale-neutral public legal routes at site root (not under /ru|kk/). */
export const PUBLIC_LEGAL_ROOT_SEGMENTS = [
  'privacy',
  'terms',
  'account-deletion',
  'community',
  'personal-data-consent',
  'business-terms',
  'offer',
  'advertising-rules',
  'cookies',
] as const;

export type PublicLegalRootSegment = 'privacy' | 'terms' | 'account-deletion';

export type ExtendedLegalRootSegment = (typeof PUBLIC_LEGAL_ROOT_SEGMENTS)[number];

/** Public consumer help (locale-neutral). */
export const PUBLIC_HELP_ROOT_SEGMENT = 'help' as const;

/** Legacy store-draft path — redirects to /help (no duplicate page). */
export const PUBLIC_SUPPORT_COMPAT_SEGMENT = 'support' as const;

const PUBLIC_LOCALE_NEUTRAL_ROOT_SEGMENTS = new Set<string>([
  ...PUBLIC_LEGAL_ROOT_SEGMENTS,
  PUBLIC_HELP_ROOT_SEGMENT,
  PUBLIC_SUPPORT_COMPAT_SEGMENT,
]);

export function isPublicLegalRootPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 1) return false;
  return (PUBLIC_LEGAL_ROOT_SEGMENTS as readonly string[]).includes(parts[0]!);
}

export function isPublicHelpRootPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length === 1 && parts[0] === PUBLIC_HELP_ROOT_SEGMENT;
}

/** Legal, help, and /support compat — excluded from F.5 locale-prefix redirects. */
export function isPublicLocaleNeutralRootPath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 1) return false;
  return PUBLIC_LOCALE_NEUTRAL_ROOT_SEGMENTS.has(parts[0]!);
}

export function publicHelpPath(): string {
  return `/${PUBLIC_HELP_ROOT_SEGMENT}`;
}

export function publicLegalPath(segment: ExtendedLegalRootSegment): string {
  return `/${segment}`;
}
