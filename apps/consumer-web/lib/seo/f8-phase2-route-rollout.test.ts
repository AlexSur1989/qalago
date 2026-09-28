/**
 * F.8.2 — public route social preview rollout verification.
 *
 * Route matrix (apps/consumer-web/app):
 * | Route | Class | Social fallback | Notes |
 * |-------|-------|-----------------|-------|
 * | / | C redirect | layout rootSiteMetadata only (pre-redirect) | 308 → /{locale}/{city} |
 * | /[locale]/[citySlug] | A indexable | metadataForCity | RU/KK canonical |
 * | .../categories | A | metadataForCityCategories | |
 * | .../[categorySlug] | A | metadataForCategory | |
 * | .../[subcategorySlug] | A | metadataForSubcategory | |
 * | .../business/[slug] | A | metadataForCanonicalBusiness | fallback only; no locationId in OG |
 * | .../search | B noindex | metadataForSearch | robots noindex; fallback OK |
 * | /privacy,/terms,/account-deletion,/help | A neutral | metadataForLegalPage / help | no hreflang |
 * | /support | C redirect | none dedicated | → /help |
 * | /categories, /categories/[id] | C redirect | none dedicated | locale city routes |
 * | /businesses/[id] | C redirect + B | metadataForTemporaryBusinessDetail | noindex; NO og:image |
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  metadataForCanonicalBusiness,
  metadataForCategory,
  metadataForCity,
  metadataForCityCategories,
  metadataForHelpPage,
  metadataForLegalPage,
  metadataForSearch,
  metadataForSubcategory,
  metadataForTemporaryBusinessDetail,
  rootSiteMetadata,
} from './page-metadata';
import {
  DEFAULT_SOCIAL_PREVIEW_PATH,
  SOCIAL_PREVIEW_HEIGHT,
  SOCIAL_PREVIEW_WIDTH,
} from './social-preview';
import { siteMetadataForLocale } from '@/lib/locale';

const ENV_KEYS = [
  'NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_CONSUMER_WEB_URL',
] as const;

const PRODUCTION_ORIGIN = 'https://qalago.kz';
const FALLBACK_ABSOLUTE = `${PRODUCTION_ORIGIN}${DEFAULT_SOCIAL_PREVIEW_PATH}`;

type MetaWithSocial = {
  openGraph?: { images?: unknown; url?: string };
  twitter?: { card?: string; images?: unknown };
  alternates?: { canonical?: string; languages?: unknown };
  robots?: unknown;
};

function firstOgImageUrl(metadata: MetaWithSocial): string {
  const images = metadata.openGraph?.images;
  expect(Array.isArray(images)).toBe(true);
  const first = images?.[0];
  if (typeof first === 'string') return first;
  expect(first && typeof first === 'object' && 'url' in first).toBe(true);
  return String((first as { url: string }).url);
}

function assertDefaultSocialPreview(metadata: MetaWithSocial): void {
  const ogImage = firstOgImageUrl(metadata);
  expect(ogImage).toBe(FALLBACK_ABSOLUTE);
  expect(metadata.openGraph?.images?.[0]).toMatchObject({
    width: SOCIAL_PREVIEW_WIDTH,
    height: SOCIAL_PREVIEW_HEIGHT,
  });
  expect(metadata.twitter?.card).toBe('summary_large_image');
  expect(metadata.twitter?.images?.[0]).toBe(FALLBACK_ABSOLUTE);
}

afterEach(() => {
  vi.unstubAllEnvs();
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe('F.8.2 route social preview rollout', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL', PRODUCTION_ORIGIN);
  });

  it('1. root layout metadata (home landing family)', () => {
    const { title, description } = siteMetadataForLocale('ru');
    const m = rootSiteMetadata('ru', title, description);
    assertDefaultSocialPreview(m);
    expect(m.metadataBase?.toString()).toBe(`${PRODUCTION_ORIGIN}/`);
  });

  it('2. RU city — canonical equals openGraph.url', () => {
    const m = metadataForCity('uralsk', 'Уральск', 'ru');
    assertDefaultSocialPreview(m);
    expect(m.alternates?.canonical).toBe(`${PRODUCTION_ORIGIN}/ru/uralsk`);
    expect(m.openGraph?.url).toBe(m.alternates?.canonical);
  });

  it('3. KK city — shared image, KK canonical', () => {
    const m = metadataForCity('uralsk', 'Орал', 'kk');
    assertDefaultSocialPreview(m);
    expect(m.alternates?.canonical).toBe(`${PRODUCTION_ORIGIN}/kk/uralsk`);
    expect(m.openGraph?.url).toBe(`${PRODUCTION_ORIGIN}/kk/uralsk`);
    expect(firstOgImageUrl(m)).toBe(FALLBACK_ABSOLUTE);
  });

  it('4. city categories index', () => {
    const m = metadataForCityCategories('uralsk', 'Уральск', 'ru');
    assertDefaultSocialPreview(m);
    expect(m.openGraph?.url).toBe(`${PRODUCTION_ORIGIN}/ru/uralsk/categories`);
  });

  it('5. category', () => {
    const m = metadataForCategory('uralsk', 'Уральск', 'restaurants', 'Рестораны', 'ru', 1);
    assertDefaultSocialPreview(m);
    expect(m.openGraph?.url).toBe(`${PRODUCTION_ORIGIN}/ru/uralsk/restaurants`);
  });

  it('6. subcategory', () => {
    const m = metadataForSubcategory(
      'uralsk',
      'Уральск',
      'restaurants',
      'Рестораны',
      'cafes',
      'Кафе',
      'kk',
      1,
    );
    assertDefaultSocialPreview(m);
    expect(m.openGraph?.url).toBe(`${PRODUCTION_ORIGIN}/kk/uralsk/restaurants/cafes`);
  });

  it('7. canonical business — fallback only', () => {
    const m = metadataForCanonicalBusiness(
      'uralsk',
      'bar-code',
      'Bar Code',
      'Desc',
      'ru',
    );
    assertDefaultSocialPreview(m);
    expect(m.openGraph?.url).toBe(`${PRODUCTION_ORIGIN}/ru/uralsk/business/bar-code`);
  });

  it('8. business OG identity unchanged by locationId (metadata API has no locationId)', () => {
    const withoutBranch = metadataForCanonicalBusiness(
      'aktobe',
      'brand-x',
      'Brand X',
      null,
      'ru',
    );
    const again = metadataForCanonicalBusiness('aktobe', 'brand-x', 'Brand X', null, 'ru');
    expect(withoutBranch).toEqual(again);
    expect(withoutBranch.openGraph?.url).not.toContain('locationId');
    assertDefaultSocialPreview(withoutBranch);
  });

  it('9–11. legal pages locale-neutral + fallback', () => {
    for (const page of ['privacy', 'terms', 'account-deletion'] as const) {
      const m = metadataForLegalPage(page, 'ru');
      assertDefaultSocialPreview(m);
      expect(m.alternates?.canonical).toBe(`${PRODUCTION_ORIGIN}/${page}`);
      expect(m.openGraph?.url).toBe(`${PRODUCTION_ORIGIN}/${page}`);
      expect(m.alternates?.languages).toBeUndefined();
    }
  });

  it('12. /help locale-neutral + fallback', () => {
    const m = metadataForHelpPage('kk');
    assertDefaultSocialPreview(m);
    expect(m.alternates?.canonical).toBe(`${PRODUCTION_ORIGIN}/help`);
    expect(m.openGraph?.url).toBe(`${PRODUCTION_ORIGIN}/help`);
    expect(m.alternates?.languages).toBeUndefined();
  });

  it('13. search — noindex preserved, fallback present', () => {
    const m = metadataForSearch('uralsk', 'Уральск', 'ru', 'coffee');
    assertDefaultSocialPreview(m);
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.openGraph?.url).toContain('/ru/uralsk/search');
    expect(m.openGraph?.url).toContain('q=coffee');
  });

  it('14. /support — redirect compat only, no generateMetadata', () => {
    const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../app/support/page.tsx');
    const src = fs.readFileSync(appDir, 'utf8');
    expect(src).toContain('permanentRedirect');
    expect(src).not.toMatch(/generateMetadata/);
  });

  it('15. legacy /businesses/[id] — noindex, no social preview identity', () => {
    const m = metadataForTemporaryBusinessDetail('Legacy Biz');
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.openGraph?.images).toBeUndefined();
    expect(m.twitter?.images).toBeUndefined();
    expect(m.alternates?.canonical).toBeUndefined();
  });
});
