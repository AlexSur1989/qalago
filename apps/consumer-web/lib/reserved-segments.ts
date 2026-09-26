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

/**
 * Explicit locale-level compatibility shorthands that intentionally use the
 * default city, e.g. `/kk/categories` → `/kk/uralsk/categories`.
 *
 * This is deliberately narrower than [CITY_RESERVED_SEGMENTS]: arbitrary
 * `/{locale}/{segment}` paths are city slugs under the locked F.5 grammar.
 */
export const DEFAULT_CITY_LOCALE_SHORTHANDS = new Set([
  'categories',
  'search',
]);

export function isReservedCitySegment(segment: string): boolean {
  return CITY_RESERVED_SEGMENTS.has(segment.toLowerCase());
}

export function isDefaultCityLocaleShorthand(segment: string): boolean {
  return DEFAULT_CITY_LOCALE_SHORTHANDS.has(segment.toLowerCase());
}
