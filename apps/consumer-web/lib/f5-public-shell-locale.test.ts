import { describe, expect, it } from 'vitest';
import { UI_LABELS } from './locale';
import { resolveEffectivePublicLocale } from './locale-path';

/** Mirrors PublicShell label selection (URL locale authoritative; layout prop fallback). */
function shellNavState(pathname: string, layoutFallback: 'ru' | 'kk') {
  const activeLocale = resolveEffectivePublicLocale(pathname, layoutFallback);
  const labels = UI_LABELS[activeLocale];
  return {
    activeLocale,
    navHome: labels.navHome,
    categories: labels.categories,
    citySwitcherLabel: labels.citySwitcherLabel,
  };
}

describe('F.5 PublicShell URL-authoritative UI locale', () => {
  it('RU pathname + RU fallback => RU nav labels', () => {
    const s = shellNavState('/ru/aktobe', 'ru');
    expect(s.activeLocale).toBe('ru');
    expect(s.navHome).toBe('Главная');
    expect(s.categories).toBe('Категории');
  });

  it('KK pathname + stale RU layout fallback => KK nav labels (key regression)', () => {
    const s = shellNavState('/kk/aktobe', 'ru');
    expect(s.activeLocale).toBe('kk');
    expect(s.navHome).toBe('Басты бет');
    expect(s.categories).toBe('Санаттар');
  });

  it('RU pathname + stale KK layout fallback => RU nav labels', () => {
    const s = shellNavState('/ru/aktobe/categories', 'kk');
    expect(s.activeLocale).toBe('ru');
    expect(s.navHome).toBe('Главная');
    expect(s.categories).toBe('Категории');
  });

  it('consecutive RU -> KK -> RU follows pathname locale', () => {
    let s = shellNavState('/ru/aktobe', 'ru');
    expect(s.navHome).toBe('Главная');

    s = shellNavState('/kk/aktobe', 'ru');
    expect(s.navHome).toBe('Басты бет');

    s = shellNavState('/ru/aktobe', 'kk');
    expect(s.navHome).toBe('Главная');
  });

  it('consecutive KK -> RU -> KK follows pathname locale', () => {
    let s = shellNavState('/kk/aktobe', 'kk');
    expect(s.categories).toBe('Санаттар');

    s = shellNavState('/ru/aktobe', 'kk');
    expect(s.categories).toBe('Категории');

    s = shellNavState('/kk/aktobe/bars', 'ru');
    expect(s.categories).toBe('Санаттар');
  });

  it('CitySwitcher contract uses active locale labels when layout is stale', () => {
    const s = shellNavState('/kk/uralsk', 'ru');
    expect(s.activeLocale).toBe('kk');
    expect(s.citySwitcherLabel).toBe(UI_LABELS.kk.citySwitcherLabel);
    expect(s.citySwitcherLabel).not.toBe(UI_LABELS.ru.citySwitcherLabel);
  });
});
