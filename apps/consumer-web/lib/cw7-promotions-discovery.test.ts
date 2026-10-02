import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { findCategoryBySlug } from './category-resolve';
import { canonicalBusinessPagePath } from './business-page-paths';
import { UI_LABELS } from './locale';
import { fetchCityPromotions } from './promotions-api';
import { CITY_PROMOTIONS_PAGE_LIMIT } from './promotions-page';
import { cityPromotionsPath } from './routes';
import { isReservedCitySegment } from './reserved-segments';
import { metadataForCityPromotions } from './seo/page-metadata';
import { breadcrumbsForCityPromotions } from './seo/discovery-breadcrumbs';
import type { CategoryDto } from './catalog-api';

const APP_ROOT = join(import.meta.dirname, '..');

const categories: CategoryDto[] = [
  { id: 'c1', slug: 'restaurants', nameRu: 'Рестораны', nameKk: 'Ресторандар', icon: null },
];

describe('CW.7 city promotions discovery', () => {
  it('promotions route page exists under locale and city', () => {
    const src = readFileSync(
      join(APP_ROOT, 'app/[locale]/[citySlug]/promotions/page.tsx'),
      'utf8',
    );
    expect(src).toContain('fetchCityPromotions');
    expect(src).toContain('CITY_PROMOTIONS_PAGE_LIMIT');
    expect(src).toContain('OrganicPromotionCard');
    expect(src).toContain('PaginationLinks');
  });

  it('reserved segment promotions does not resolve as category', () => {
    expect(isReservedCitySegment('promotions')).toBe(true);
    expect(findCategoryBySlug(categories, 'promotions')).toBeUndefined();
  });

  it('cityPromotionsPath is locale-prefixed', () => {
    expect(cityPromotionsPath('ru', 'uralsk')).toBe('/ru/uralsk/promotions');
    expect(cityPromotionsPath('kk', 'aktobe')).toBe('/kk/aktobe/promotions');
  });

  it('fetchCityPromotions uses citySlug and activeNow', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchCityPromotions('uralsk', { page: 2, limit: 10 });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('citySlug=uralsk');
    expect(url).toContain('activeNow=true');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
    vi.unstubAllGlobals();
  });

  it('default page limit matches discovery constant', () => {
    expect(CITY_PROMOTIONS_PAGE_LIMIT).toBe(20);
  });

  it('organic card links use canonical business path with locationId', () => {
    const href = canonicalBusinessPagePath('ru', 'uralsk', 'bar-code-51', 'loc-1');
    expect(href).toContain('/ru/uralsk/business/bar-code-51');
    expect(href).toContain('locationId=loc-1');
  });

  it('home promotions CTA links to city promotions page', () => {
    const src = readFileSync(
      join(APP_ROOT, 'components/home/HomePromotionsSection.tsx'),
      'utf8',
    );
    expect(src).toContain('cityPromotionsPath');
    expect(src).toContain('homeAllPromotions');
    expect(src).not.toContain('SponsoredLabel');
    expect(src).not.toContain('AD_CLICK');
  });

  it('organic promotion card uses PROMOTION_VIEW not ad events', () => {
    const src = readFileSync(join(APP_ROOT, 'components/analytics/TrackedPromotionLink.tsx'), 'utf8');
    expect(src).toContain("'PROMOTION_VIEW'");
    expect(src).not.toContain('AD_CLICK');
    const card = readFileSync(join(APP_ROOT, 'components/promotions/OrganicPromotionCard.tsx'), 'utf8');
    expect(card).toContain('TrackedPromotionLink');
    expect(card).not.toMatch(/sponsored\s*=\s*\{?\s*true/);
  });

  it('RU/KK UI labels for promotions discovery', () => {
    for (const locale of ['ru', 'kk'] as const) {
      expect(UI_LABELS[locale].homeAllPromotions.length).toBeGreaterThan(3);
      expect(UI_LABELS[locale].promotionsPageTitle.length).toBeGreaterThan(2);
      expect(UI_LABELS[locale].promotionsPageIntro.length).toBeGreaterThan(10);
      expect(UI_LABELS[locale].promotionsLoadError.length).toBeGreaterThan(10);
    }
    expect(UI_LABELS.ru.homeAllPromotions).toContain('Все');
    expect(UI_LABELS.kk.homeAllPromotions).toContain('акция');
  });

  it('SEO metadata is indexable with canonical and hreflang', () => {
    const m = metadataForCityPromotions('uralsk', 'Уральск', 'ru', 1);
    expect(m.alternates?.canonical).toContain('/ru/uralsk/promotions');
    expect(m.alternates?.languages?.ru).toContain('/ru/uralsk/promotions');
    expect(m.alternates?.languages?.kk).toContain('/kk/uralsk/promotions');
    expect(m.robots).toBeUndefined();
    const kk = metadataForCityPromotions('uralsk', 'Орал', 'kk', 2);
    expect(kk.alternates?.canonical).toContain('page=2');
  });

  it('breadcrumbs Home → Promotions localized', () => {
    const city = {
      id: 'city-1',
      slug: 'uralsk',
      nameRu: 'Уральск',
      nameKk: 'Орал',
    };
    const ru = breadcrumbsForCityPromotions(city, 'ru');
    expect(ru.at(-1)?.label).toBe(UI_LABELS.ru.promotionsPageTitle);
    const kk = breadcrumbsForCityPromotions(city, 'kk');
    expect(kk.at(-1)?.label).toBe(UI_LABELS.kk.promotionsPageTitle);
  });

  it('promotions page has no auth dependency', () => {
    const src = readFileSync(
      join(APP_ROOT, 'app/[locale]/[citySlug]/promotions/page.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/Authorization|login|favorites/i);
  });

  it('empty state uses localized message', () => {
    const src = readFileSync(
      join(APP_ROOT, 'app/[locale]/[citySlug]/promotions/page.tsx'),
      'utf8',
    );
    expect(src).toContain('emptyHomePromotions');
    expect(src).toContain('promotionsLoadError');
  });
});
