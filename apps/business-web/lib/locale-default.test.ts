import { describe, expect, it } from 'vitest';
import { LOCALE_COOKIE_NAME, normalizeLocale } from './locale';
import { readClientLocale } from './locale-client';

describe('KZ-C.1C business-web Kazakh-first product default', () => {
  it('normalizeLocale: no preference / kk / ru / invalid', () => {
    expect(normalizeLocale(undefined)).toBe('kk');
    expect(normalizeLocale(null)).toBe('kk');
    expect(normalizeLocale('kk')).toBe('kk');
    expect(normalizeLocale('ru')).toBe('ru');
    expect(normalizeLocale('en')).toBe('kk');
    expect(normalizeLocale('nope')).toBe('kk');
  });

  it('readClientLocale without document (SSR) → kk', () => {
    expect(readClientLocale()).toBe('kk');
  });

  it('uses canonical cookie name', () => {
    expect(LOCALE_COOKIE_NAME).toBe('qalago_locale');
  });
});
