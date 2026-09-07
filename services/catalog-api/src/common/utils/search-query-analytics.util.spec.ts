import {
  aggregateSearchQueries,
  MIN_SEARCH_QUERY_DISPLAY_COUNT,
  normalizeSearchQueryForAnalytics,
  SEARCH_QUERY_MAX_LENGTH,
} from './search-query-analytics.util';

describe('normalizeSearchQueryForAnalytics', () => {
  it('trims and collapses repeated spaces', () => {
    expect(normalizeSearchQueryForAnalytics('  Кофе   рядом ')).toBe('кофе рядом');
  });

  it('lowercases Latin while preserving Cyrillic', () => {
    expect(normalizeSearchQueryForAnalytics('КОФЕЙНЯ')).toBe('кофейня');
  });

  it('preserves Kazakh Cyrillic characters', () => {
    expect(normalizeSearchQueryForAnalytics('дәмхана')).toBe('дәмхана');
    expect(normalizeSearchQueryForAnalytics('мейрамхана')).toBe('мейрамхана');
  });

  it('returns null for empty or too-short queries', () => {
    expect(normalizeSearchQueryForAnalytics('')).toBeNull();
    expect(normalizeSearchQueryForAnalytics('  ')).toBeNull();
    expect(normalizeSearchQueryForAnalytics('a')).toBeNull();
  });

  it('caps overly long queries', () => {
    const raw = 'a'.repeat(SEARCH_QUERY_MAX_LENGTH + 20);
    expect(normalizeSearchQueryForAnalytics(raw)?.length).toBe(SEARCH_QUERY_MAX_LENGTH);
  });
});

describe('aggregateSearchQueries', () => {
  it('returns top queries with percentages over attributed SEARCH views', () => {
    const result = aggregateSearchQueries([
      { searchQuery: 'кофе рядом', count: 214 },
      { searchQuery: 'кофейня', count: 183 },
      { searchQuery: 'завтрак', count: 97 },
    ]);

    expect(result.status).toBe('AVAILABLE');
    expect(result.queries[0]).toMatchObject({
      query: 'кофе рядом',
      count: 214,
      percentage: expect.any(Number),
    });
    const totalPct = result.queries.reduce((sum, row) => sum + row.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it('hides queries below MIN_SEARCH_QUERY_DISPLAY_COUNT threshold', () => {
    const result = aggregateSearchQueries([
      { searchQuery: 'кофе', count: 3 },
      { searchQuery: 'чай', count: 2 },
      { searchQuery: 'сок', count: 1 },
    ]);

    expect(result.queries).toHaveLength(1);
    expect(result.queries[0].query).toBe('кофе');
    expect(result.otherCount).toBe(3);
    expect(MIN_SEARCH_QUERY_DISPLAY_COUNT).toBe(3);
  });

  it('returns INSUFFICIENT_DATA when no query reaches threshold', () => {
    const result = aggregateSearchQueries([
      { searchQuery: 'кофе', count: 2 },
      { searchQuery: 'чай', count: 1 },
    ]);

    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.queries).toEqual([]);
    expect(result.otherCount).toBe(3);
  });

  it('returns INSUFFICIENT_DATA for zero attributed views', () => {
    expect(aggregateSearchQueries([])).toEqual({
      queries: [],
      otherCount: 0,
      status: 'INSUFFICIENT_DATA',
    });
  });
});
