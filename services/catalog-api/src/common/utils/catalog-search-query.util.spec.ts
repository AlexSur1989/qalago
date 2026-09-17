import {
  CATALOG_SEARCH_MAX_LENGTH,
  catalogSearchNeedle,
  normalizeCatalogSearchQuery,
  publicServiceItemMatchesCatalogSearch,
} from './catalog-search-query.util';

describe('catalog-search-query.util (6.11B.1)', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeCatalogSearchQuery('  детская   одежда  ')).toBe('детская одежда');
  });

  it('preserves Kazakh characters', () => {
    expect(normalizeCatalogSearchQuery('Балалар киімі')).toBe('Балалар киімі');
    expect(normalizeCatalogSearchQuery('әғқңөұүһі')).toBe('әғқңөұүһі');
  });

  it('returns null for empty normalized query', () => {
    expect(normalizeCatalogSearchQuery('   ')).toBeNull();
    expect(normalizeCatalogSearchQuery(null)).toBeNull();
  });

  it('accepts 100-character query', () => {
    const q = 'a'.repeat(100);
    expect(normalizeCatalogSearchQuery(q)).toBe(q);
    expect(q.length).toBe(CATALOG_SEARCH_MAX_LENGTH);
  });

  it('catalog needle lowercases for in-memory public catalog filter', () => {
    expect(catalogSearchNeedle('  Pizza  ')).toBe('pizza');
  });

  it('matches service item titleKk and descriptionKk', () => {
    expect(
      publicServiceItemMatchesCatalogSearch(
        { title: 'Other', titleKk: 'Балалар киімі', description: null, descriptionKk: null },
        'балалар',
      ),
    ).toBe(true);
    expect(
      publicServiceItemMatchesCatalogSearch(
        { title: 'X', description: null, descriptionKk: 'маникюр қызметі' },
        'маникюр',
      ),
    ).toBe(true);
  });
});
