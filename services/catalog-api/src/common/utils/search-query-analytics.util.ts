/** Stage 5I — search query normalization and dashboard aggregation. */

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 100;
export const MIN_SEARCH_QUERY_DISPLAY_COUNT = 3;
export const SEARCH_QUERY_TOP_N = 10;

export type SearchQueryAggregateRow = {
  searchQuery: string;
  count: number;
};

export type SearchQueryAggregateItem = {
  query: string;
  count: number;
  percentage: number;
};

export type SearchQueryAggregateResult = {
  queries: SearchQueryAggregateItem[];
  otherCount: number;
  status: 'AVAILABLE' | 'INSUFFICIENT_DATA';
};

/** Trim, collapse spaces, lowercase; reject empty/too-short; cap length. */
export function normalizeSearchQueryForAnalytics(raw?: string | null): string | null {
  if (raw == null) return null;
  const collapsed = raw.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  if (collapsed.length < SEARCH_QUERY_MIN_LENGTH) return null;
  if (collapsed.length > SEARCH_QUERY_MAX_LENGTH) {
    return collapsed.slice(0, SEARCH_QUERY_MAX_LENGTH);
  }
  return collapsed;
}

/**
 * Groups SEARCH-attributed views by normalized query.
 * Denominator: all VIEW_BUSINESS with trafficSource=SEARCH and valid searchQuery.
 * Only queries with count >= MIN_SEARCH_QUERY_DISPLAY_COUNT are returned.
 */
export function aggregateSearchQueries(
  rows: SearchQueryAggregateRow[],
  topN = SEARCH_QUERY_TOP_N,
): SearchQueryAggregateResult {
  const totalAttributed = rows.reduce((sum, row) => sum + row.count, 0);
  if (totalAttributed === 0) {
    return { queries: [], otherCount: 0, status: 'INSUFFICIENT_DATA' };
  }

  const eligible = rows.filter((row) => row.count >= MIN_SEARCH_QUERY_DISPLAY_COUNT);
  const otherCount = rows
    .filter((row) => row.count < MIN_SEARCH_QUERY_DISPLAY_COUNT)
    .reduce((sum, row) => sum + row.count, 0);

  if (eligible.length === 0) {
    return { queries: [], otherCount, status: 'INSUFFICIENT_DATA' };
  }

  const queries = [...eligible]
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((row) => ({
      query: row.searchQuery,
      count: row.count,
      percentage: Math.round((row.count / totalAttributed) * 1000) / 10,
    }));

  return { queries, otherCount, status: 'AVAILABLE' };
}
