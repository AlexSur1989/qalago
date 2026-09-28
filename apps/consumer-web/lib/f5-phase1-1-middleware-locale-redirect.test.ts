import { describe, expect, it } from 'vitest';
import { config } from '../middleware';
import {
  joinRedirectTarget,
  resolveMiddlewareLocaleRedirect,
} from './middleware-public-locale-redirect';
import { DEFAULT_CITY_LOCALE_SHORTHANDS } from './reserved-segments';

function resolve(
  pathname: string,
  search = '',
  cookie?: string,
): ReturnType<typeof resolveMiddlewareLocaleRedirect> {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return resolveMiddlewareLocaleRedirect(pathname, params, cookie ?? null);
}

function redirectTarget(
  pathname: string,
  search = '',
  cookie?: string,
): string | null {
  const decision = resolve(pathname, search, cookie);
  if (decision.kind !== 'permanent') return null;
  return joinRedirectTarget(decision.pathname, decision.search);
}

describe('F.5 Phase 1.1 middleware locale redirect hotfix', () => {
  it('1 neutral /uralsk + no cookie → /kk/uralsk', () => {
    expect(redirectTarget('/uralsk')).toBe('/kk/uralsk');
  });

  it('2 neutral /uralsk + ru cookie → /ru/uralsk', () => {
    expect(redirectTarget('/uralsk', '', 'qalago_locale=ru')).toBe('/ru/uralsk');
  });

  it('3 neutral /uralsk + kk cookie → /kk/uralsk', () => {
    expect(redirectTarget('/uralsk', '', 'qalago_locale=kk')).toBe('/kk/uralsk');
  });

  it('4 invalid cookie → /kk/uralsk', () => {
    expect(redirectTarget('/uralsk', '', 'qalago_locale=nope')).toBe('/kk/uralsk');
  });

  it('5 nested neutral path preserved', () => {
    expect(redirectTarget('/uralsk/restaurants/cafes')).toBe('/kk/uralsk/restaurants/cafes');
  });

  it('6 business neutral path preserved', () => {
    expect(redirectTarget('/uralsk/business/bar-code-51')).toBe(
      '/kk/uralsk/business/bar-code-51',
    );
  });

  it('7 locationId preserved', () => {
    expect(redirectTarget('/uralsk/business/example', '?locationId=L1')).toBe(
      '/kk/uralsk/business/example?locationId=L1',
    );
  });

  it('8 supported safe page preserved', () => {
    expect(redirectTarget('/uralsk/restaurants', '?page=3')).toBe(
      '/kk/uralsk/restaurants?page=3',
    );
  });

  it('9 search q preserved', () => {
    expect(redirectTarget('/uralsk/search', '?q=coffee')).toBe('/kk/uralsk/search?q=coffee');
  });

  it('10 arbitrary unsupported query not propagated', () => {
    expect(redirectTarget('/uralsk/business/example', '?locationId=L1&utm_bad=x')).toBe(
      '/kk/uralsk/business/example?locationId=L1',
    );
  });

  it('11 /ru/... does not neutral-redirect', () => {
    const d = resolve('/ru/uralsk');
    expect(d.kind).toBe('none');
    expect(d).toMatchObject({ routeLocale: 'ru' });
    expect(redirectTarget('/ru/uralsk')).toBeNull();
  });

  it('12 /kk/... does not neutral-redirect', () => {
    const d = resolve('/kk/uralsk');
    expect(d.kind).toBe('none');
    expect(d).toMatchObject({ routeLocale: 'kk' });
  });

  it('13 /ru → /ru/uralsk', () => {
    expect(redirectTarget('/ru')).toBe('/ru/uralsk');
  });

  it('14 /kk → /kk/uralsk', () => {
    expect(redirectTarget('/kk')).toBe('/kk/uralsk');
  });

  it('15 explicit default-city locale shorthands only', () => {
    expect([...DEFAULT_CITY_LOCALE_SHORTHANDS]).toEqual(['categories', 'search']);
    expect(redirectTarget('/ru/categories')).toBe('/ru/uralsk/categories');
    expect(redirectTarget('/kk/categories')).toBe('/kk/uralsk/categories');
    expect(redirectTarget('/ru/search')).toBe('/ru/uralsk/search');
    expect(redirectTarget('/kk/search')).toBe('/kk/uralsk/search');
  });

  it('15a arbitrary second segment remains citySlug for current and future cities', () => {
    for (const locale of ['ru', 'kk']) {
      for (const citySlug of ['aktobe', 'almaty', 'astana', 'ne-sushestvuet']) {
        const path = `/${locale}/${citySlug}`;
        expect(redirectTarget(path)).toBeNull();
        expect(resolve(path)).toMatchObject({ kind: 'none', routeLocale: locale });
      }
    }
  });

  it('15b business is not an invented default-city shorthand', () => {
    expect(redirectTarget('/kk/business/example')).toBeNull();
    expect(resolve('/kk/business/example')).toMatchObject({
      kind: 'none',
      routeLocale: 'kk',
    });
  });

  it('15c nested canonical city routes pass through', () => {
    for (const path of [
      '/kk/aktobe/categories',
      '/kk/aktobe/restaurants',
      '/kk/aktobe/restaurants/cafes',
      '/kk/aktobe/search',
      '/kk/aktobe/business/example',
      '/ru/aktobe/search',
    ]) {
      expect(redirectTarget(path)).toBeNull();
    }
  });

  it('15d neutral city and unknown-city paths preserve the logical city', () => {
    expect(redirectTarget('/aktobe', '', 'qalago_locale=kk')).toBe('/kk/aktobe');
    expect(redirectTarget('/aktobe', '', 'qalago_locale=ru')).toBe('/ru/aktobe');
    expect(redirectTarget('/ne-sushestvuet', '', 'qalago_locale=kk')).toBe(
      '/kk/ne-sushestvuet',
    );
    expect(redirectTarget('/ne-sushestvuet', '', 'qalago_locale=ru')).toBe(
      '/ru/ne-sushestvuet',
    );
  });

  it('16 /businesses/{id} excluded from generic middleware redirect', () => {
    expect(resolve('/businesses/abc123').kind).toBe('none');
  });

  it('17 /categories* excluded where required', () => {
    expect(resolve('/categories').kind).toBe('none');
    expect(resolve('/categories/cat-id').kind).toBe('none');
  });

  it('18 /robots.txt excluded via matcher', () => {
    expect(config.matcher.join('|')).not.toMatch(/robots\.txt\)/);
    expect(config.matcher.some((m) => m.includes('robots.txt'))).toBe(true);
  });

  it('19 /sitemap.xml excluded via matcher', () => {
    expect(config.matcher.some((m) => m.includes('sitemap.xml'))).toBe(true);
  });

  it('20 /icon excluded via matcher', () => {
    expect(config.matcher.some((m) => m.includes('icon'))).toBe(true);
  });

  it('21 favicon still in matcher for rewrite', () => {
    expect(config.matcher).toContain('/favicon.ico');
  });

  it('22 /_next excluded via matcher', () => {
    expect(config.matcher.some((m) => m.includes('_next/static'))).toBe(true);
  });

  it('23 unknown neutral path redirects once', () => {
    expect(redirectTarget('/unknown-slug')).toBe('/kk/unknown-slug');
  });

  it('24 unsupported locale is not accepted as supported locale', () => {
    expect(redirectTarget('/en/uralsk')).toBeNull();
    expect(resolve('/en/uralsk').kind).toBe('none');
  });

  it('25 no redirect loop on canonical paths', () => {
    expect(redirectTarget('/ru/uralsk')).toBeNull();
    expect(redirectTarget('/kk/uralsk/business/x')).toBeNull();
  });

  it('26 redirect targets stay path-local (same-origin safe)', () => {
    const target = redirectTarget('/uralsk')!;
    expect(target.startsWith('/')).toBe(true);
    expect(target.includes('://')).toBe(false);
  });

  it('root / is not double-redirected by middleware', () => {
    expect(resolve('/').kind).toBe('none');
  });
});
