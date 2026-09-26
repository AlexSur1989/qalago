import { describe, expect, it, vi, afterEach } from 'vitest';
import robots from '../app/robots';
import {
  buildBusinessBySlugRequestPath,
  canonicalBusinessPagePath,
  parseBusinessCityMismatchBody,
  BUSINESS_LOCATION_CITY_MISMATCH_CODE,
} from './business-page-paths';
import { discoveryBusinessDetailHref, toPublicBusinessCard } from './public-business';
import { resolveLegacyBusinessRedirectPath } from './temporary-business-redirect';
import { dedupeBusinessCitySitemapUrls } from './business-sitemap';
import { canonicalForBusiness } from './seo/canonical';
import { metadataForCanonicalBusiness } from './seo/page-metadata';
import { buildDiscoverySitemapEntries } from './seo/sitemap-builder';
import { isReservedCitySegment } from './reserved-segments';
import { UI_LABELS } from './locale';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('F.4 canonical business routes', () => {
  it('builds slug API path with citySlug and optional locationId', () => {
    expect(buildBusinessBySlugRequestPath('my-brand', 'uralsk')).toBe(
      '/businesses/by-slug/my-brand?citySlug=uralsk',
    );
    expect(buildBusinessBySlugRequestPath('my-brand', 'uralsk', 'loc-1')).toBe(
      '/businesses/by-slug/my-brand?citySlug=uralsk&locationId=loc-1',
    );
  });

  it('canonical page path uses citySlug + businessSlug', () => {
    expect(canonicalBusinessPagePath('uralsk', 'coffee-house')).toBe(
      '/uralsk/business/coffee-house',
    );
  });

  it('preserves locationId in page path but not in SEO canonical', () => {
    expect(canonicalBusinessPagePath('uralsk', 'coffee-house', 'bl-9')).toBe(
      '/uralsk/business/coffee-house?locationId=bl-9',
    );
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    expect(canonicalForBusiness('uralsk', 'coffee-house')).toBe(
      'https://qalago.kz/uralsk/business/coffee-house',
    );
    expect(canonicalForBusiness('uralsk', 'coffee-house')).not.toContain('locationId');
  });

  it('parses wrong-city mismatch payload safely', () => {
    const payload = parseBusinessCityMismatchBody({
      code: BUSINESS_LOCATION_CITY_MISMATCH_CODE,
      businessSlug: 'brand-x',
      locationId: 'loc-aktobe',
      citySlug: 'aktobe',
      cityId: 'secret',
      ownerId: 'secret',
    });
    expect(payload).toEqual({
      businessSlug: 'brand-x',
      locationId: 'loc-aktobe',
      citySlug: 'aktobe',
    });
  });

  it('wrong-city normalization target path', () => {
    const path = canonicalBusinessPagePath('aktobe', 'brand-x', 'loc-aktobe');
    expect(path).toBe('/aktobe/business/brand-x?locationId=loc-aktobe');
  });

  it('discovery links use canonical F.4 paths', () => {
    const card = toPublicBusinessCard({
      id: 'b1',
      title: 'T',
      slug: 'brand-slug',
      address: 'A',
      contextLocationId: 'loc-2',
    });
    expect(discoveryBusinessDetailHref('uralsk', card)).toBe(
      '/uralsk/business/brand-slug?locationId=loc-2',
    );
  });

  it('branch switch same city keeps citySlug', () => {
    expect(canonicalBusinessPagePath('uralsk', 'brand', 'loc-a')).toContain('/uralsk/business/');
  });

  it('branch switch different city uses branch citySlug', () => {
    expect(canonicalBusinessPagePath('aktobe', 'brand', 'loc-b')).toBe(
      '/aktobe/business/brand?locationId=loc-b',
    );
  });

  it('legacy ID redirect preserves branch context', () => {
    const path = resolveLegacyBusinessRedirectPath(
      {
        id: 'b1',
        title: 'T',
        slug: 'brand',
        address: 'A',
        activeLocationId: 'loc-2',
      },
      [
        {
          id: 'loc-1',
          businessId: 'b1',
          cityId: 'c1',
          city: { slug: 'uralsk', nameRu: 'U' },
          address: 'U',
          latitude: null,
          longitude: null,
          workHours: null,
          phone: null,
          whatsapp: null,
          instagram: null,
          website: null,
          isPrimary: true,
        },
        {
          id: 'loc-2',
          businessId: 'b1',
          cityId: 'c2',
          city: { slug: 'aktobe', nameRu: 'A' },
          address: 'A',
          latitude: null,
          longitude: null,
          workHours: null,
          phone: null,
          whatsapp: null,
          instagram: null,
          website: null,
          isPrimary: false,
        },
      ],
      'loc-2',
    );
    expect(path).toBe('/aktobe/business/brand?locationId=loc-2');
  });

  it('sitemap dedupes business slug per city', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const urls = dedupeBusinessCitySitemapUrls('uralsk', [
      { slug: 'a' },
      { slug: 'a' },
      { slug: 'b' },
    ]);
    expect(urls).toHaveLength(2);
    expect(urls.every((u) => !u.includes('locationId'))).toBe(true);
    expect(urls.every((u) => !u.includes('/businesses/'))).toBe(true);
  });

  it('sitemap builder excludes locationId variants', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const entries = buildDiscoverySitemapEntries({
      cities: [{ id: '1', slug: 'uralsk', nameRu: 'U', nameKk: 'U' }],
      categoriesByCitySlug: { uralsk: [] },
      subcategoriesByCategoryId: {},
      businessUrlsByCitySlug: {
        uralsk: ['https://qalago.kz/uralsk/business/foo'],
      },
    });
    expect(entries.some((e) => e.url.includes('locationId'))).toBe(false);
  });

  it('robots keeps /businesses/ disallowed', () => {
    const rules = robots().rules;
    const all = Array.isArray(rules) ? rules[0] : rules;
    expect(all?.disallow).toContain('/businesses/');
  });

  it('reserved business segment prevents category collision', () => {
    expect(isReservedCitySegment('business')).toBe(true);
  });

  it('metadata for canonical business is indexable', () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', 'https://qalago.kz');
    const meta = metadataForCanonicalBusiness(
      'uralsk',
      'brand',
      'Brand Title',
      'Short desc',
      'ru',
    );
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.alternates?.canonical).toBe('https://qalago.kz/uralsk/business/brand');
  });

  it('RU and KK business section labels exist', () => {
    expect(UI_LABELS.ru.businessGalleryTitle.length).toBeGreaterThan(0);
    expect(UI_LABELS.kk.businessReviewsTitle.length).toBeGreaterThan(0);
  });

  it('notFound contract: fetchBusinessBySlug not_found is explicit status', async () => {
    const { fetchBusinessBySlug } = await import('./catalog-api');
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 404 }),
    );
    const result = await fetchBusinessBySlug({
      businessSlug: 'missing',
      citySlug: 'uralsk',
    });
    expect(result.status).toBe('not_found');
  });

  it('409 city_mismatch maps to structured payload', async () => {
    const { fetchBusinessBySlug } = await import('./catalog-api');
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          code: BUSINESS_LOCATION_CITY_MISMATCH_CODE,
          businessSlug: 'b',
          locationId: 'l',
          citySlug: 'aktobe',
        }),
        { status: 409 },
      ),
    );
    const result = await fetchBusinessBySlug({
      businessSlug: 'b',
      citySlug: 'uralsk',
      locationId: 'l',
    });
    expect(result.status).toBe('city_mismatch');
    if (result.status === 'city_mismatch') {
      expect(result.payload.citySlug).toBe('aktobe');
    }
  });
});
