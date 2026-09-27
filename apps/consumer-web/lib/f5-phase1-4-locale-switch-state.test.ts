import { describe, expect, it } from 'vitest';
import {
  evaluateLocaleSwitch,
  resolveEffectivePublicLocale,
} from './locale-path';

function params(record: Record<string, string>): URLSearchParams {
  return new URLSearchParams(record);
}

function applySwitch(
  pathname: string,
  query: Record<string, string>,
  targetLocale: 'ru' | 'kk',
  layoutFallback: 'ru' | 'kk',
): { pathname: string; query: Record<string, string> } {
  const decision = evaluateLocaleSwitch(
    pathname,
    params(query),
    targetLocale,
    layoutFallback,
  );
  expect(decision.shouldNavigate).toBe(true);
  const url = new URL(decision.target, 'http://localhost');
  const nextQuery: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    nextQuery[k] = v;
  });
  return { pathname: url.pathname, query: nextQuery };
}

describe('F.5 Phase 1.4 URL-derived locale switch state', () => {
  it('active locale follows pathname when supported locale exists', () => {
    expect(resolveEffectivePublicLocale('/kk/aktobe/search', 'ru')).toBe('kk');
    expect(resolveEffectivePublicLocale('/ru/uralsk', 'kk')).toBe('ru');
  });

  it('fallback layout locale when pathname has no supported locale', () => {
    expect(resolveEffectivePublicLocale('/categories', 'ru')).toBe('ru');
  });

  it('stale RU layout prop + KK pathname → switch to RU is not no-op', () => {
    const decision = evaluateLocaleSwitch(
      '/kk/aktobe/search',
      params({ q: 'coffee' }),
      'ru',
      'ru',
    );
    expect(decision.shouldNavigate).toBe(true);
    expect(decision.target).toBe('/ru/aktobe/search?q=coffee');
  });

  it('stale KK layout prop + RU pathname → switch to KK is not no-op', () => {
    const decision = evaluateLocaleSwitch(
      '/ru/aktobe/search',
      params({ q: 'coffee' }),
      'kk',
      'kk',
    );
    expect(decision.shouldNavigate).toBe(true);
    expect(decision.target).toBe('/kk/aktobe/search?q=coffee');
  });

  it('RU → KK → RU without reload semantics (stale layout fallback throughout)', () => {
    const layoutFallback = 'ru' as const;
    let pathname = '/ru/aktobe/search';
    let query: Record<string, string> = { q: 'coffee' };

    ({ pathname, query } = applySwitch(pathname, query, 'kk', layoutFallback));
    expect(pathname).toBe('/kk/aktobe/search');
    expect(query.q).toBe('coffee');

    ({ pathname, query } = applySwitch(pathname, query, 'ru', layoutFallback));
    expect(pathname).toBe('/ru/aktobe/search');
    expect(query.q).toBe('coffee');
  });

  it('KK → RU → KK without reload semantics (stale layout fallback throughout)', () => {
    const layoutFallback = 'kk' as const;
    let pathname = '/kk/aktobe/search';
    let query: Record<string, string> = { q: 'coffee' };

    ({ pathname, query } = applySwitch(pathname, query, 'ru', layoutFallback));
    expect(pathname).toBe('/ru/aktobe/search');

    ({ pathname, query } = applySwitch(pathname, query, 'kk', layoutFallback));
    expect(pathname).toBe('/kk/aktobe/search');
    expect(query.q).toBe('coffee');
  });

  it('q + page preserved on switch', () => {
    const decision = evaluateLocaleSwitch(
      '/ru/aktobe/search',
      params({ q: 'coffee', page: '2' }),
      'kk',
      'ru',
    );
    expect(decision.target).toContain('q=coffee');
    expect(decision.target).toContain('page=2');
  });

  it('locationId preserved on business path', () => {
    const decision = evaluateLocaleSwitch(
      '/ru/uralsk/business/foo',
      params({ locationId: 'L1' }),
      'kk',
      'ru',
    );
    expect(decision.target).toBe('/kk/uralsk/business/foo?locationId=L1');
  });

  it('unsupported arbitrary query not propagated', () => {
    const decision = evaluateLocaleSwitch(
      '/ru/aktobe/search',
      params({ q: 'coffee', utm_source: 'x' }),
      'kk',
      'ru',
    );
    expect(decision.target).toBe('/kk/aktobe/search?q=coffee');
  });

  it('no-op only when target equals URL-derived active locale', () => {
    expect(
      evaluateLocaleSwitch('/kk/aktobe/search', params({ q: 'coffee' }), 'kk', 'ru')
        .shouldNavigate,
    ).toBe(false);
  });
});
