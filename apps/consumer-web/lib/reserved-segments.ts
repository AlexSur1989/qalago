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
