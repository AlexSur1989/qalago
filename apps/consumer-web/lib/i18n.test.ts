import { describe, expect, it } from 'vitest';
import {
  LOCALE_COOKIE_NAME,
  UI_LABELS,
  categoryDisplayName,
  normalizeLocale,
  siteMetadataForLocale,
  subcategoryDisplayName,
} from './locale';

describe('consumer-web i18n stage 6.10B.4', () => {
  it('normalizes ru and kk cookie values', () => {
    expect(normalizeLocale('ru')).toBe('ru');
    expect(normalizeLocale('kk')).toBe('kk');
    expect(normalizeLocale('kk-KZ')).toBe('kk');
  });

  it('falls back invalid locale to kk product default', () => {
    expect(normalizeLocale('en')).toBe('kk');
    expect(normalizeLocale('')).toBe('kk');
    expect(normalizeLocale(undefined)).toBe('kk');
  });

  it('uses canonical cookie name', () => {
    expect(LOCALE_COOKIE_NAME).toBe('qalago_locale');
  });

  it('home RU and KK labels', () => {
    expect(UI_LABELS.ru.navHome).toBe('Главная');
    expect(UI_LABELS.kk.navHome).toBe('Басты бет');
  });

  it('categories RU and KK', () => {
    expect(UI_LABELS.ru.categories).toBe('Категории');
    expect(UI_LABELS.kk.categories).toBe('Санаттар');
  });

  it('category nameRu and nameKk', () => {
    const cat = { nameRu: 'Красота', nameKk: 'Сұлулық', title: 'Красота' };
    expect(categoryDisplayName(cat, 'ru')).toBe('Красота');
    expect(categoryDisplayName(cat, 'kk')).toBe('Сұлулық');
  });

  it('subcategory nameRu and nameKk', () => {
    expect(subcategoryDisplayName({ nameRu: 'Кафе', nameKk: 'Кафелер' }, 'kk')).toBe('Кафелер');
  });

  it('business list empty RU and KK', () => {
    expect(UI_LABELS.ru.emptyBusinesses).toBe('Заведения не найдены');
    expect(UI_LABELS.kk.emptyBusinesses).toBe('Мекемелер табылмады');
  });

  it('business detail chrome labels', () => {
    expect(UI_LABELS.ru.businessCoverAlt.length).toBeGreaterThan(0);
    expect(UI_LABELS.kk.businessCoverAlt.length).toBeGreaterThan(0);
    expect(UI_LABELS.ru.allCategories).toBe('Все категории');
    expect(UI_LABELS.kk.allCategories).toBe('Барлық санаттар');
  });

  it('dynamic business content is not in UI_LABELS', () => {
    const joined = JSON.stringify(UI_LABELS);
    expect(joined).not.toContain('machineTranslate');
  });

  it('ad label RU and KK', () => {
    expect(UI_LABELS.ru.adLabel).toBe('Реклама');
    expect(UI_LABELS.kk.adLabel).toBe('Жарнама');
  });

  it('empty and error states RU and KK', () => {
    expect(UI_LABELS.ru.notFoundTitle).toBeTruthy();
    expect(UI_LABELS.kk.notFoundTitle).toBeTruthy();
    expect(UI_LABELS.ru.errorTitle).toBeTruthy();
    expect(UI_LABELS.kk.errorTitle).toBeTruthy();
  });

  it('header/navigation strings RU and KK', () => {
    expect(UI_LABELS.ru.back).toContain('Назад');
    expect(UI_LABELS.kk.back).toContain('Артқа');
    expect(UI_LABELS.ru.allSubcategories).toBe('Все');
    expect(UI_LABELS.kk.allSubcategories).toBe('Барлығы');
  });

  it('language switch labels', () => {
    expect(UI_LABELS.ru.localeRu).toBe('Русский');
    expect(UI_LABELS.ru.localeKk).toBe('Қазақша');
    expect(UI_LABELS.kk.localeRu).toBe('Русский');
    expect(UI_LABELS.kk.localeKk).toBe('Қазақша');
  });

  it('metadata RU and KK', () => {
    expect(siteMetadataForLocale('ru').description).toContain('Гид');
    expect(siteMetadataForLocale('kk').description).toContain('нұсқау');
    expect(siteMetadataForLocale('ru').title).toBe('QalaGo');
    expect(siteMetadataForLocale('kk').title).toBe('QalaGo');
  });

  it('search labels RU and KK (F.2)', () => {
    expect(UI_LABELS.ru.searchPlaceholder.length).toBeGreaterThan(0);
    expect(UI_LABELS.kk.searchSubmit.length).toBeGreaterThan(0);
  });
});
