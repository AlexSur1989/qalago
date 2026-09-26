import { SUPPORTED_PUBLIC_LOCALES } from './public-locale';

/** Top-level App Router segments — never city slugs (F.5). */
export const TOP_LEVEL_RESERVED_SEGMENTS = new Set<string>([
  ...SUPPORTED_PUBLIC_LOCALES,
]);

/** Reserved under /{citySlug}/… — not category slugs (Stage 6.11F.2). */
export const CITY_RESERVED_SEGMENTS = new Set([
  'categories',
  'search',
  'promotions',
  'business',
  'privacy',
  'terms',
  'support',
  'account-deletion',
]);

export function isReservedCitySegment(segment: string): boolean {
  return CITY_RESERVED_SEGMENTS.has(segment.toLowerCase());
}
