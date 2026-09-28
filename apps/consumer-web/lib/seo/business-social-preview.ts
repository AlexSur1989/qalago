/**
 * F.8.3 — trusted Business cover URLs for social metadata (reference-only; no fetch).
 *
 * Media audit (Consumer Web + Catalog API):
 * - Public `coverImageUrl` is usually `/uploads/...` (QalaGo static uploads on Catalog API).
 * - API may also return absolute URLs on the configured API origin; arbitrary external URLs
 *   (e.g. legacy CDN) are possible in data — must be rejected for OG.
 * - `effectiveMedia.coverImageUrl` can be branch-specific when `locationId` is active — **not**
 *   used for Business-grain social preview in F.8.3 (see § F.8 contract).
 */
import { getApiOrigin } from '@/lib/public-config';
import { getConsumerWebOrigin, normalizeConsumerWebOrigin } from './canonical';

const UPLOADS_PREFIX = '/uploads/';

function trustedOrigins(): Set<string> {
  return new Set([
    normalizeConsumerWebOrigin(getConsumerWebOrigin()),
    normalizeConsumerWebOrigin(getApiOrigin()),
  ]);
}

function isSafeUploadsPathname(pathname: string): boolean {
  if (!pathname.startsWith(UPLOADS_PREFIX)) return false;
  if (pathname.includes('..') || pathname.includes('\\')) return false;
  if (pathname.includes('//')) return false;
  return /^\/uploads\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(pathname);
}

/**
 * Returns an absolute crawler-visible URL on the Consumer Web origin, or null → use QalaGo fallback.
 */
export function resolveTrustedPublicBusinessCoverUrl(
  raw: string | null | undefined,
): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) return null;

  const consumerOrigin = normalizeConsumerWebOrigin(getConsumerWebOrigin());

  if (trimmed.startsWith('/')) {
    if (!isSafeUploadsPathname(trimmed)) return null;
    return `${consumerOrigin}${trimmed}`;
  }

  if (!/^https?:\/\//i.test(trimmed)) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const origin = normalizeConsumerWebOrigin(`${parsed.protocol}//${parsed.host}`);
  if (!trustedOrigins().has(origin)) return null;
  if (!isSafeUploadsPathname(parsed.pathname)) return null;

  return `${consumerOrigin}${parsed.pathname}`;
}
