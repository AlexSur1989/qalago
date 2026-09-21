const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 100;

export function normalizeSearchQuery(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_SEARCH_LENGTH);
}

export function isSearchQueryTooShort(query: string): boolean {
  return query.length > 0 && query.length < MIN_SEARCH_LENGTH;
}

export function parsePageParam(raw: string | null | undefined): number {
  const n = Number.parseInt(raw ?? '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export const SEARCH_RESULTS_LIMIT = 20;
