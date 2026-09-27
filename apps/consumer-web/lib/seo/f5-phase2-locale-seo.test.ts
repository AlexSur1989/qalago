import { afterEach, describe, expect, it, vi } from 'vitest';
import { dedupeBusinessCitySitemapUrls } from '../business-sitemap';
import {
  buildIndexableLocaleSeoAlternates,
  canonicalForBusiness,
  canonicalForCategory,
  canonicalForCity,
} from './canonical';
import {
  metadataForCanonicalBusiness,
  metadataForCategory,
  metadataForCity,
} from './page-metadata';
import { buildDiscoverySitemapEntries } from './sitemap-builder';

const ENV_KEYS = [
  'NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_CONSUMER_WEB_URL',
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe('F.5 Phase 2 locale SEO', () => {
  it('canonical matrix RU vs KK city', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    expect(canonicalForCity('ru', 'aktobe')).toBe('https://qalago.kz/ru/aktobe');
    expect(canonicalForCity('kk', 'aktobe')).toBe('https://qalago.kz/kk/aktobe');
    expect(canonicalForCity('ru', 'aktobe')).not.toBe(canonicalForCity('kk', 'aktobe'));
  });

  it('category pagination keeps ?page with locale prefix', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    expect(canonicalForCategory('kk', 'aktobe', 'bars', 2)).toBe(
      'https://qalago.kz/kk/aktobe/bars?page=2',
    );
  });

  it('business canonical excludes locationId', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const url = canonicalForBusiness('ru', 'aktobe', 'aktobe-coffee-lab');
    expect(url).toBe('https://qalago.kz/ru/aktobe/business/aktobe-coffee-lab');
    expect(url).not.toContain('locationId');
  });

  it('hreflang city — RU page', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const m = metadataForCity('aktobe', 'Актобе', 'ru');
    expect(m.alternates?.canonical).toBe('https://qalago.kz/ru/aktobe');
    expect(m.alternates?.languages?.ru).toBe('https://qalago.kz/ru/aktobe');
    expect(m.alternates?.languages?.kk).toBe('https://qalago.kz/kk/aktobe');
    expect(m.alternates?.languages?.['x-default']).toBe('https://qalago.kz/ru/aktobe');
    expect(m.openGraph?.url).toBe('https://qalago.kz/ru/aktobe');
  });

  it('hreflang city — KK page reciprocal set', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const ru = metadataForCity('aktobe', 'Актобе', 'ru');
    const kk = metadataForCity('aktobe', 'Ақтөбе', 'kk');
    expect(kk.alternates?.languages).toEqual(ru.alternates?.languages);
    expect(kk.alternates?.canonical).toBe('https://qalago.kz/kk/aktobe');
  });

  it('hreflang category and business', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const cat = metadataForCategory('aktobe', 'Актобе', 'bars', 'Bars', 'ru', 1);
    expect(cat.alternates?.languages?.['x-default']).toBe('https://qalago.kz/ru/aktobe/bars');
    const biz = metadataForCanonicalBusiness(
      'aktobe',
      'brand',
      'Brand',
      null,
      'kk',
    );
    expect(biz.alternates?.canonical).toBe('https://qalago.kz/kk/aktobe/business/brand');
    expect(biz.alternates?.languages?.ru).toBe('https://qalago.kz/ru/aktobe/business/brand');
  });

  it('buildIndexableLocaleSeoAlternates x-default is always RU', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const kk = buildIndexableLocaleSeoAlternates('kk', {
      citySlug: 'uralsk',
      pathSegments: ['restaurants'],
    });
    expect(kk.languages['x-default']).toBe('https://qalago.kz/ru/uralsk/restaurants');
  });

  it('sitemap emits RU and KK only — no neutral paths', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const entries = buildDiscoverySitemapEntries({
      cities: [{ id: 'c1', slug: 'aktobe', nameRu: 'Актобе', nameKk: 'Ақтөбе' }],
      categoriesByCitySlug: {
        aktobe: [
          {
            id: 'cat1',
            slug: 'bars',
            title: 'Bars',
            nameRu: 'Бары',
            nameKk: 'Барлар',
            sortOrder: 1,
          },
        ],
      },
      subcategoriesByCategoryId: {},
    });
    const urls = entries.map((e) => e.url);
    expect(urls).toContain('https://qalago.kz/ru/aktobe');
    expect(urls).toContain('https://qalago.kz/kk/aktobe');
    expect(urls).toContain('https://qalago.kz/ru/aktobe/bars');
    expect(urls).toContain('https://qalago.kz/kk/aktobe/bars');
    expect(urls.some((u) => u === 'https://qalago.kz/aktobe')).toBe(false);
    expect(urls.some((u) => u.includes('/search'))).toBe(false);
    expect(urls.some((u) => u.includes('/businesses/'))).toBe(false);
    expect(urls.some((u) => u.includes('?'))).toBe(false);
  });

  it('multi-city business sitemap = 2 locales × 2 cities', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const uralsk = dedupeBusinessCitySitemapUrls('uralsk', [{ slug: 'same-brand' }]);
    const aktobe = dedupeBusinessCitySitemapUrls('aktobe', [{ slug: 'same-brand' }]);
    const all = [...uralsk, ...aktobe];
    expect(all).toHaveLength(4);
    expect(all).toContain('https://qalago.kz/ru/uralsk/business/same-brand');
    expect(all).toContain('https://qalago.kz/kk/aktobe/business/same-brand');
    expect(all.every((u) => !u.includes('locationId'))).toBe(true);
  });
});
