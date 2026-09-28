import { describe, expect, it } from 'vitest';
import { DEFAULT_CITY_SLUG } from './public-config';
import { legalPageUrl } from './legal-links';
import { PUBLIC_LEGAL_ROOT_SEGMENTS } from './legal-paths';
import {
  cityCategoriesPath,
  cityHomePath,
  parseCitySlugFromPathname,
} from './routes';

/** Mirrors PublicShell header/footer href resolution on legal pages. */
function publicShellNavHrefs(pathname: string, layoutLocale: 'ru' | 'kk') {
  const activeLocale = layoutLocale;
  const citySlug = parseCitySlugFromPathname(pathname) ?? DEFAULT_CITY_SLUG;
  return {
    logo: cityHomePath(activeLocale, citySlug),
    home: cityHomePath(activeLocale, citySlug),
    categories: cityCategoriesPath(activeLocale, citySlug),
    footerPrivacy: legalPageUrl('privacy'),
    footerTerms: legalPageUrl('terms'),
    footerAccountDeletion: legalPageUrl('accountDeletion'),
  };
}

describe('F.7 Phase 5 hotfix — PublicShell nav on legal pages', () => {
  for (const segment of PUBLIC_LEGAL_ROOT_SEGMENTS) {
    const pathname = `/${segment}`;

    it(`RU: ${pathname} logo/home → default city home, not /ru/${segment}`, () => {
      const h = publicShellNavHrefs(pathname, 'ru');
      expect(h.logo).toBe(`/ru/${DEFAULT_CITY_SLUG}`);
      expect(h.home).toBe(`/ru/${DEFAULT_CITY_SLUG}`);
      expect(h.logo).not.toBe(`/ru/${segment}`);
    });

    it(`KK: ${pathname} logo/home → default city home, not /kk/${segment}`, () => {
      const h = publicShellNavHrefs(pathname, 'kk');
      expect(h.logo).toBe(`/kk/${DEFAULT_CITY_SLUG}`);
      expect(h.home).toBe(`/kk/${DEFAULT_CITY_SLUG}`);
      expect(h.logo).not.toBe(`/kk/${segment}`);
    });

    it(`${pathname} categories → locale city categories`, () => {
      expect(publicShellNavHrefs(pathname, 'ru').categories).toBe(
        `/ru/${DEFAULT_CITY_SLUG}/categories`,
      );
      expect(publicShellNavHrefs(pathname, 'kk').categories).toBe(
        `/kk/${DEFAULT_CITY_SLUG}/categories`,
      );
    });

    it(`${pathname} footer legal links stay locale-neutral`, () => {
      const h = publicShellNavHrefs(pathname, 'ru');
      expect(h.footerPrivacy).toBe('/privacy');
      expect(h.footerTerms).toBe('/terms');
      expect(h.footerAccountDeletion).toBe('/account-deletion');
    });
  }

  it('parseCitySlugFromPathname does not treat legal roots as cities', () => {
    expect(parseCitySlugFromPathname('/privacy')).toBeNull();
    expect(parseCitySlugFromPathname('/terms')).toBeNull();
    expect(parseCitySlugFromPathname('/account-deletion')).toBeNull();
    expect(parseCitySlugFromPathname('/help')).toBeNull();
  });

  it('discovery city parsing unchanged', () => {
    expect(parseCitySlugFromPathname('/ru/aktobe/bars')).toBe('aktobe');
    expect(parseCitySlugFromPathname('/uralsk')).toBe('uralsk');
  });
});
