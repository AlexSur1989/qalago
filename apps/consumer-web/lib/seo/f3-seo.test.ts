import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from '../../app/robots';
import {
  buildCanonicalUrl,
  canonicalForCategory,
  canonicalForCity,
  canonicalForSearch,
  getConsumerWebOrigin,
  normalizeConsumerWebOrigin,
} from './canonical';
import { serializeJsonLd, breadcrumbListJsonLd } from './json-ld';
import {
  metadataForCategory,
  metadataForCity,
  metadataForSearch,
  metadataForSubcategory,
  metadataForTemporaryBusinessDetail,
} from './page-metadata';
import { buildDiscoverySitemapEntries } from './sitemap-builder';
import { jsonLdFromCrumbs } from './discovery-breadcrumbs';
import { parsePageParam } from '../search-query';

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

describe('F.3 canonical URL builder', () => {
  it('normalizes production base URL without trailing slash', () => {
    expect(normalizeConsumerWebOrigin('https://qalago.kz/')).toBe('https://qalago.kz');
    expect(normalizeConsumerWebOrigin('qalago.kz')).toBe('https://qalago.kz');
  });

  it('rejects unsafe origin protocols', () => {
    expect(() => normalizeConsumerWebOrigin('javascript:alert(1)')).toThrow(/Unsafe/);
  });

  it('builds city and category paths with encoded segments', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    expect(canonicalForCity('uralsk')).toBe('https://qalago.kz/uralsk');
    expect(canonicalForCategory('uralsk', 'restaurants', 2)).toBe(
      'https://qalago.kz/uralsk/restaurants?page=2',
    );
  });

  it('omits page=1 and normalizes invalid page via builder', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    expect(canonicalForCategory('uralsk', 'food', 1)).toBe('https://qalago.kz/uralsk/food');
    expect(buildCanonicalUrl({ citySlug: 'uralsk', pathSegments: ['food'], page: 0 })).toBe(
      'https://qalago.kz/uralsk/food',
    );
  });

  it('parsePageParam normalizes invalid values', () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('-1')).toBe(1);
    expect(parsePageParam('01')).toBe(1);
    expect(parsePageParam('2')).toBe(2);
  });

  it('search canonical encodes query safely', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    expect(canonicalForSearch('uralsk', 'café & tea')).toBe(
      'https://qalago.kz/uralsk/search?q=caf%C3%A9%20%26%20tea',
    );
  });

  it('does not leak localhost when production origin configured', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    expect(getConsumerWebOrigin()).toBe('https://qalago.kz');
    expect(canonicalForCity('uralsk')).not.toContain('localhost');
  });
});

describe('F.3 metadata', () => {
  it('city metadata RU', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const m = metadataForCity('uralsk', 'Уральск', 'ru');
    expect(m.title).toContain('Уральск');
    expect(m.alternates?.canonical).toBe('https://qalago.kz/uralsk');
  });

  it('city metadata KK', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const m = metadataForCity('uralsk', 'Орал', 'kk');
    expect(String(m.title)).toContain('Орал');
    expect(String(m.title)).toContain('қаласындағы');
  });

  it('category and subcategory metadata', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const cat = metadataForCategory('uralsk', 'Уральск', 'restaurants', 'Рестораны', 'ru', 1);
    expect(cat.title).toContain('Рестораны');
    expect(cat.alternates?.canonical).toBe('https://qalago.kz/uralsk/restaurants');
    const sub = metadataForSubcategory(
      'uralsk',
      'Уральск',
      'restaurants',
      'Рестораны',
      'cafes',
      'Кафе',
      'ru',
      3,
    );
    expect(sub.alternates?.canonical).toBe('https://qalago.kz/uralsk/restaurants/cafes?page=3');
  });

  it('search and temporary business use noindex,follow', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const search = metadataForSearch('uralsk', 'Уральск', 'ru', 'cafe');
    expect(search.robots).toEqual({ index: false, follow: true });
    const biz = metadataForTemporaryBusinessDetail('Test Biz');
    expect(biz.robots).toEqual({ index: false, follow: true });
    expect(biz.alternates?.canonical).toBeUndefined();
  });
});

describe('F.3 robots and sitemap', () => {
  it('robots declares sitemap and allows public discovery', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const r = robots();
    expect(r.sitemap).toBe('https://qalago.kz/sitemap.xml');
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules?.allow).toBe('/');
    expect(rules?.disallow).toContain('/businesses/');
  });

  it('sitemap includes discovery routes and excludes search/business legacy', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const entries = buildDiscoverySitemapEntries({
      cities: [{ id: 'c1', slug: 'uralsk', nameRu: 'Уральск', nameKk: 'Орал' }],
      categoriesByCitySlug: {
        uralsk: [
          {
            id: 'cat1',
            slug: 'food',
            title: 'Food',
            nameRu: 'Еда',
            nameKk: 'Тамақ',
            sortOrder: 1,
          },
        ],
      },
      subcategoriesByCategoryId: {
        cat1: [
          {
            id: 'sub1',
            categoryId: 'cat1',
            slug: 'cafes',
            nameRu: 'Кафе',
            nameKk: 'Кафе',
            sortOrder: 1,
          },
        ],
      },
    });
    const urls = entries.map((e) => e.url);
    expect(urls).toContain('https://qalago.kz/uralsk');
    expect(urls).toContain('https://qalago.kz/uralsk/categories');
    expect(urls).toContain('https://qalago.kz/uralsk/food');
    expect(urls).toContain('https://qalago.kz/uralsk/food/cafes');
    expect(urls.some((u) => u.includes('/search'))).toBe(false);
    expect(urls.some((u) => u.includes('/businesses/'))).toBe(false);
    expect(urls.some((u) => u.includes('/categories'))).toBe(true);
  });

  it('sitemap skips unknown city categories bucket', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const entries = buildDiscoverySitemapEntries({
      cities: [{ id: 'c2', slug: 'ghost', nameRu: 'X', nameKk: 'X' }],
      categoriesByCitySlug: {},
      subcategoriesByCategoryId: {},
    });
    expect(entries.map((e) => e.url)).toEqual(['https://qalago.kz/ghost', 'https://qalago.kz/ghost/categories']);
  });
});

describe('F.3 JSON-LD safety and breadcrumbs', () => {
  it('escapes script breakouts in JSON-LD', () => {
    const raw = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(raw).not.toContain('</script>');
    expect(raw).toContain('\\u003c');
  });

  it('breadcrumb JSON-LD uses controlled paths', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const items = jsonLdFromCrumbs(
      [
        { label: 'QalaGo', href: '/uralsk' },
        { label: 'Uralsk', href: '/uralsk' },
        { label: 'Food' },
      ],
      '/uralsk/food',
    );
    const ld = breadcrumbListJsonLd(items);
    const json = JSON.stringify(ld);
    expect(json).toContain('https://qalago.kz/uralsk/food');
  });
});
