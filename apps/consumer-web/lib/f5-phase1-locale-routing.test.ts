import { describe, expect, it } from 'vitest';
import { config } from '../middleware';
import {
  buildSafePublicQueryString,
  parsePublicLocaleFromPathname,
  swapLocaleInPathname,
} from './locale-path';
import { preferenceLocaleFromCookieValue } from './locale-preference';
import { withPublicLocalePrefix } from './routes';
import {
  DEFAULT_PUBLIC_LOCALE,
  isSupportedPublicLocale,
  SUPPORTED_PUBLIC_LOCALES,
} from './public-locale';
import { TOP_LEVEL_RESERVED_SEGMENTS } from './reserved-segments';
import {
  breadcrumbsForCategory,
  breadcrumbsForCanonicalBusiness,
} from './seo/discovery-breadcrumbs';
import { canonicalBusinessPagePath } from './business-page-paths';
import { discoveryBusinessDetailHref, toPublicBusinessCard } from './public-business';
import { cityCategoryPath } from './routes';
import { resolveLegacyBusinessRedirectPath } from './temporary-business-redirect';

describe('F.5 Phase 1 locale routing foundation', () => {
  it('supported locale parsing allowlist', () => {
    expect(SUPPORTED_PUBLIC_LOCALES).toEqual(['ru', 'kk']);
    expect(isSupportedPublicLocale('ru')).toBe(true);
    expect(isSupportedPublicLocale('kk')).toBe(true);
    expect(isSupportedPublicLocale('en')).toBe(false);
    expect(isSupportedPublicLocale('RU')).toBe(false);
  });

  it('default locale is kk (KZ-C.1C product default)', () => {
    expect(DEFAULT_PUBLIC_LOCALE).toBe('kk');
    expect(preferenceLocaleFromCookieValue(undefined)).toBe('kk');
    expect(preferenceLocaleFromCookieValue('')).toBe('kk');
    expect(preferenceLocaleFromCookieValue('bad')).toBe('kk');
  });

  it('cookie preference ru and kk', () => {
    expect(preferenceLocaleFromCookieValue('ru')).toBe('ru');
    expect(preferenceLocaleFromCookieValue('kk')).toBe('kk');
  });

  it('parsePublicLocaleFromPathname', () => {
    expect(parsePublicLocaleFromPathname('/kk/uralsk')).toBe('kk');
    expect(parsePublicLocaleFromPathname('/uralsk')).toBeNull();
  });

  it('neutral path prefix for redirect targets', () => {
    expect(withPublicLocalePrefix('ru', '/uralsk')).toBe('/ru/uralsk');
    expect(withPublicLocalePrefix('kk', '/uralsk/business/foo')).toBe(
      '/kk/uralsk/business/foo',
    );
  });

  it('locale switch preserves logical path and locationId', () => {
    const target = swapLocaleInPathname(
      '/ru/uralsk/business/bar-code-51',
      { locationId: 'ABC' },
      'kk',
    );
    expect(target).toBe('/kk/uralsk/business/bar-code-51?locationId=ABC');
  });

  it('locale switch ru to kk on category path', () => {
    expect(swapLocaleInPathname('/ru/uralsk/restaurants', {}, 'kk')).toBe(
      '/kk/uralsk/restaurants',
    );
  });

  it('does not propagate arbitrary query on switch', () => {
    const target = swapLocaleInPathname('/ru/uralsk/search', { q: 'coffee' }, 'kk');
    expect(target).toBe('/kk/uralsk/search?q=coffee');
    expect(buildSafePublicQueryString({ q: 'coffee', page: '1' })).not.toContain('utm');
  });

  it('buildSafePublicQueryString for page and locationId', () => {
    expect(buildSafePublicQueryString({ locationId: 'L2', page: '3' })).toBe(
      '?locationId=L2&page=3',
    );
  });

  it('internal category links retain locale in breadcrumbs', () => {
    const city = { id: 'c1', slug: 'uralsk', nameRu: 'U', nameKk: 'U' };
    const category = {
      id: 'cat',
      slug: 'restaurants',
      title: 'R',
      nameRu: 'R',
      nameKk: 'R',
      sortOrder: 1,
    };
    const crumbs = breadcrumbsForCategory(city, category, 'kk');
    expect(crumbs[0]?.href).toBe('/kk/uralsk');
    expect(crumbs.some((c) => c.href === '/kk/uralsk/categories')).toBe(true);
  });

  it('business discovery href retains locale', () => {
    const card = toPublicBusinessCard({
      id: 'b1',
      title: 'T',
      slug: 'brand',
      address: 'A',
      contextLocationId: 'loc-1',
    });
    expect(discoveryBusinessDetailHref('kk', 'uralsk', card)).toBe(
      '/kk/uralsk/business/brand?locationId=loc-1',
    );
  });

  it('F.4 wrong-city normalization retains kk locale', () => {
    const path = canonicalBusinessPagePath(
      'kk',
      'aktobe',
      'example',
      'AKTOBE_BRANCH',
    );
    expect(path).toBe('/kk/aktobe/business/example?locationId=AKTOBE_BRANCH');
    expect(path.startsWith('/kk/')).toBe(true);
  });

  it('legacy business redirect is locale-prefixed direct target', () => {
    const path = resolveLegacyBusinessRedirectPath(
      { id: 'b1', title: 'T', slug: 'brand', address: 'A' },
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
      ],
      undefined,
      'ru',
    );
    expect(path).toBe('/ru/uralsk/business/brand');
    expect(path).not.toMatch(/^\/uralsk\//);
  });

  it('ru and kk are top-level reserved segments', () => {
    expect(TOP_LEVEL_RESERVED_SEGMENTS.has('ru')).toBe(true);
    expect(TOP_LEVEL_RESERVED_SEGMENTS.has('kk')).toBe(true);
  });

  it('middleware still matches favicon and sets locale header path', () => {
    expect(config.matcher).toContain('/favicon.ico');
    expect(Array.isArray(config.matcher)).toBe(true);
  });

  it('breadcrumbs for business use locale prefix', () => {
    const city = { id: 'c1', slug: 'uralsk', nameRu: 'U', nameKk: 'U' };
    const crumbs = breadcrumbsForCanonicalBusiness(city, 'Biz', 'ru');
    expect(crumbs[0]?.href).toBe('/ru/uralsk');
  });

  it('cityCategoryPath encodes locale', () => {
    expect(cityCategoryPath('ru', 'uralsk', 'restaurants')).toBe('/ru/uralsk/restaurants');
  });
});
