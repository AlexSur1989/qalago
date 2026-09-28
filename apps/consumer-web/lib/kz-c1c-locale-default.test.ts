import { describe, expect, it } from 'vitest';
import { LOCALE_COOKIE_NAME, normalizeLocale } from './locale';
import { readClientLocale } from './locale-client';
import { preferenceLocaleFromCookieValue } from './locale-preference';
import { DEFAULT_PUBLIC_LOCALE } from './public-locale';
import { defaultCityHomePath, cityHomePath } from './routes';
import { parsePublicLocaleFromPathname } from './locale-path';
import {
  joinRedirectTarget,
  resolveMiddlewareLocaleRedirect,
} from './middleware-public-locale-redirect';

describe('KZ-C.1C consumer-web Kazakh-first product default', () => {
  it('DEFAULT_PUBLIC_LOCALE is kk', () => {
    expect(DEFAULT_PUBLIC_LOCALE).toBe('kk');
  });

  it('preference resolver: no cookie / kk / ru / invalid', () => {
    expect(preferenceLocaleFromCookieValue(undefined)).toBe('kk');
    expect(preferenceLocaleFromCookieValue('kk')).toBe('kk');
    expect(preferenceLocaleFromCookieValue('ru')).toBe('ru');
    expect(preferenceLocaleFromCookieValue('nope')).toBe('kk');
  });

  it('normalizeLocale invalid → kk', () => {
    expect(normalizeLocale(null)).toBe('kk');
    expect(normalizeLocale('en')).toBe('kk');
  });

  it('root redirect targets via cityHomePath (mirrors app/page.tsx)', () => {
    expect(cityHomePath(preferenceLocaleFromCookieValue(undefined), 'uralsk')).toBe(
      '/kk/uralsk',
    );
    expect(cityHomePath(preferenceLocaleFromCookieValue('ru'), 'uralsk')).toBe('/ru/uralsk');
    expect(cityHomePath(preferenceLocaleFromCookieValue('kk'), 'uralsk')).toBe('/kk/uralsk');
    expect(defaultCityHomePath(preferenceLocaleFromCookieValue(undefined))).toBe('/kk/uralsk');
  });

  it('neutral discovery /uralsk without cookie → /kk/uralsk', () => {
    const decision = resolveMiddlewareLocaleRedirect('/uralsk', new URLSearchParams(), null);
    expect(decision.kind).toBe('permanent');
    if (decision.kind === 'permanent') {
      expect(joinRedirectTarget(decision.pathname, decision.search)).toBe('/kk/uralsk');
    }
  });

  it('explicit prefixed routes stay authoritative', () => {
    expect(parsePublicLocaleFromPathname('/ru/uralsk')).toBe('ru');
    expect(parsePublicLocaleFromPathname('/kk/uralsk')).toBe('kk');
    expect(
      resolveMiddlewareLocaleRedirect('/ru/uralsk', new URLSearchParams(), null),
    ).toMatchObject({ kind: 'none', routeLocale: 'ru' });
    expect(
      resolveMiddlewareLocaleRedirect('/kk/uralsk', new URLSearchParams(), null),
    ).toMatchObject({ kind: 'none', routeLocale: 'kk' });
  });

  it('readClientLocale without document (SSR) → kk', () => {
    expect(readClientLocale()).toBe('kk');
  });

  it('client cookie parse mirrors LocaleSwitcher persistence key', () => {
    expect(LOCALE_COOKIE_NAME).toBe('qalago_locale');
    const cookiePair = `${LOCALE_COOKIE_NAME}=ru`;
    const raw = cookiePair.split('=')[1];
    expect(normalizeLocale(raw ? decodeURIComponent(raw) : null)).toBe('ru');
  });
});
