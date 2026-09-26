import { describe, expect, it } from 'vitest';
import { buildLocaleSwitchTarget } from './locale-path';

function paramsFromRecord(record: Record<string, string>): URLSearchParams {
  return new URLSearchParams(record);
}

/** Mirrors LocaleSwitcher: pathname + current search → target locale URL. */
function switchLocalePath(
  pathname: string,
  query: Record<string, string>,
  targetLocale: 'ru' | 'kk',
): string {
  return buildLocaleSwitchTarget(pathname, paramsFromRecord(query), targetLocale);
}

describe('F.5 Phase 1.3 locale switch safe query preservation', () => {
  it('A. q preserved RU → KK on search', () => {
    expect(switchLocalePath('/ru/aktobe/search', { q: 'coffee' }, 'kk')).toBe(
      '/kk/aktobe/search?q=coffee',
    );
  });

  it('B. q preserved KK → RU on search', () => {
    expect(switchLocalePath('/kk/aktobe/search', { q: 'coffee' }, 'ru')).toBe(
      '/ru/aktobe/search?q=coffee',
    );
  });

  it('C. locationId preserved on business path', () => {
    expect(
      switchLocalePath('/ru/uralsk/business/bar-code-51', { locationId: 'L1' }, 'kk'),
    ).toBe('/kk/uralsk/business/bar-code-51?locationId=L1');
  });

  it('D. page preserved on category path', () => {
    expect(switchLocalePath('/ru/uralsk/restaurants', { page: '3' }, 'kk')).toBe(
      '/kk/uralsk/restaurants?page=3',
    );
  });

  it('E. q + locationId + page combination on search', () => {
    const target = switchLocalePath(
      '/ru/aktobe/search',
      { q: 'coffee', page: '2', locationId: 'X' },
      'kk',
    );
    expect(target).toContain('/kk/aktobe/search?');
    expect(target).toContain('q=coffee');
    expect(target).toContain('page=2');
    expect(target).toContain('locationId=X');
  });

  it('F. unsupported arbitrary query not propagated', () => {
    expect(
      switchLocalePath('/ru/aktobe/search', { q: 'coffee', utm_source: 'test' }, 'kk'),
    ).toBe('/kk/aktobe/search?q=coffee');
  });

  it('encodes q with spaces safely', () => {
    expect(switchLocalePath('/ru/aktobe/search', { q: 'ice coffee' }, 'kk')).toBe(
      '/kk/aktobe/search?q=ice+coffee',
    );
  });

  it('G. target stays same-origin path only', () => {
    const target = switchLocalePath('/ru/aktobe/search', { q: 'x' }, 'kk');
    expect(target.startsWith('/')).toBe(true);
    expect(target.includes('://')).toBe(false);
  });
});
