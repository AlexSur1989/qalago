import { describe, expect, it } from 'vitest';
import { config } from '../middleware';
import {
  joinRedirectTarget,
  resolveMiddlewareLocaleRedirect,
} from './middleware-public-locale-redirect';

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
  it('1 neutral /uralsk + no cookie → /ru/uralsk', () => {
    expect(redirectTarget('/uralsk')).toBe('/ru/uralsk');
  });

  it('2 neutral /uralsk + ru cookie → /ru/uralsk', () => {
    expect(redirectTarget('/uralsk', '', 'qalago_locale=ru')).toBe('/ru/uralsk');
  });

  it('3 neutral /uralsk + kk cookie → /kk/uralsk', () => {
    expect(redirectTarget('/uralsk', '', 'qalago_locale=kk')).toBe('/kk/uralsk');
  });

  it('4 invalid cookie → /ru/uralsk', () => {
    expect(redirectTarget('/uralsk', '', 'qalago_locale=nope')).toBe('/ru/uralsk');
  });

  it('5 nested neutral path preserved', () => {
    expect(redirectTarget('/uralsk/restaurants/cafes')).toBe('/ru/uralsk/restaurants/cafes');
  });

  it('6 business neutral path preserved', () => {
    expect(redirectTarget('/uralsk/business/bar-code-51')).toBe(
      '/ru/uralsk/business/bar-code-51',
    );
  });

  it('7 locationId preserved', () => {
    expect(redirectTarget('/uralsk/business/example', '?locationId=L1')).toBe(
      '/ru/uralsk/business/example?locationId=L1',
    );
  });

  it('8 supported safe page preserved', () => {
    expect(redirectTarget('/uralsk/restaurants', '?page=3')).toBe(
      '/ru/uralsk/restaurants?page=3',
    );
  });

  it('9 search q preserved', () => {
    expect(redirectTarget('/uralsk/search', '?q=coffee')).toBe('/ru/uralsk/search?q=coffee');
  });

  it('10 arbitrary unsupported query not propagated', () => {
    expect(redirectTarget('/uralsk/business/example', '?locationId=L1&utm_bad=x')).toBe(
      '/ru/uralsk/business/example?locationId=L1',
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

  it('15 misplaced supported locale path normalization', () => {
    expect(redirectTarget('/ru/categories')).toBe('/ru/uralsk/categories');
    expect(redirectTarget('/kk/restaurants')).toBe('/kk/uralsk/restaurants');
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
    expect(redirectTarget('/unknown-slug')).toBe('/ru/unknown-slug');
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
