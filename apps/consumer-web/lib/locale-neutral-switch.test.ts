import { describe, expect, it } from 'vitest';
import { PUBLIC_LEGAL_ROOT_SEGMENTS } from './legal-paths';
import { HELP_UI } from './help-ui';
import {
  buildLocaleSwitchTarget,
  evaluateLocaleSwitch,
  swapLocaleInPathname,
} from './locale-path';
import { preferenceLocaleFromCookieValue } from './locale-preference';

describe('Locale-neutral public routes — language switch', () => {
  const neutralPaths = ['/help', ...PUBLIC_LEGAL_ROOT_SEGMENTS.map((s) => `/${s}`)];

  for (const path of neutralPaths) {
    it(`${path}: RU → KK stays on same path (not /kk/...)`, () => {
      expect(swapLocaleInPathname(path, {}, 'kk')).toBe(path);
      expect(buildLocaleSwitchTarget(path, new URLSearchParams(), 'kk')).toBe(path);
    });

    it(`${path}: KK → RU stays on same path (not /ru/...)`, () => {
      expect(swapLocaleInPathname(path, {}, 'ru')).toBe(path);
      expect(buildLocaleSwitchTarget(path, new URLSearchParams(), 'ru')).toBe(path);
    });
  }

  it('/help: evaluateLocaleSwitch navigates to /help not /kk/help', () => {
    const { shouldNavigate, target } = evaluateLocaleSwitch(
      '/help',
      new URLSearchParams(),
      'kk',
      'ru',
    );
    expect(shouldNavigate).toBe(true);
    expect(target).toBe('/help');
    expect(target).not.toContain('/kk/help');
    expect(target).not.toContain('/ru/help');
  });

  it('help content dictionaries differ by locale (cookie-driven SSR)', () => {
    expect(HELP_UI.ru.pageHeading).toBe('Помощь');
    expect(HELP_UI.kk.pageHeading).toBe('Көмек');
    expect(preferenceLocaleFromCookieValue('kk')).toBe('kk');
  });

  it('discovery locale switch unchanged: /ru/uralsk → /kk/uralsk', () => {
    expect(swapLocaleInPathname('/ru/uralsk', {}, 'kk')).toBe('/kk/uralsk');
    expect(swapLocaleInPathname('/kk/uralsk', {}, 'ru')).toBe('/ru/uralsk');
  });

  it('/support compat path stays locale-neutral on switch', () => {
    expect(swapLocaleInPathname('/support', {}, 'kk')).toBe('/support');
  });
});
