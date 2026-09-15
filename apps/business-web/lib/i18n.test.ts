import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BusinessPermission } from './business-access';
import { scanHardcodedBusinessWebUi } from './hardcoded-ui-guard';
import {
  LOCALE_COOKIE_NAME,
  UI_LABELS,
  normalizeLocale,
  siteMetadataForLocale,
} from './locale';
import { planTierLabel } from './presentation';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('business-web i18n stage 6.10B.5', () => {
  it('normalizes ru and kk cookie values', () => {
    expect(normalizeLocale('ru')).toBe('ru');
    expect(normalizeLocale('kk')).toBe('kk');
    expect(normalizeLocale('kk-KZ')).toBe('kk');
  });

  it('falls back invalid locale to ru', () => {
    expect(normalizeLocale('en')).toBe('ru');
    expect(normalizeLocale('')).toBe('ru');
  });

  it('uses canonical cookie name', () => {
    expect(LOCALE_COOKIE_NAME).toBe('qalago_locale');
  });

  it('plan tier labels RU and KK (Flutter parity)', () => {
    expect(planTierLabel('ru', 'FREE')).toBe('Бесплатный');
    expect(planTierLabel('kk', 'FREE')).toBe('Тегін');
    expect(planTierLabel('ru', 'BASIC')).toBe('Бизнес');
    expect(planTierLabel('ru', 'PREMIUM')).toBe('PRO');
  });

  it('permission enum constants unchanged', () => {
    expect(BusinessPermission.ADS_MANAGE).toBe('ADS_MANAGE');
    expect(BusinessPermission.PAYMENTS_VIEW).toBe('PAYMENTS_VIEW');
  });

  it('owner nav labels RU and KK', () => {
    expect(UI_LABELS.ru.ownerNavOverview).toBe('Обзор');
    expect(UI_LABELS.kk.ownerNavOverview).toBe('Шолу');
    expect(UI_LABELS.ru.ownerNavPromote).toContain('Реклама');
    expect(UI_LABELS.kk.ownerNavPromote).toContain('Жарнама');
  });

  it('language switch labels', () => {
    expect(UI_LABELS.ru.localeRu).toBe('Русский');
    expect(UI_LABELS.kk.localeKk).toBe('Қазақша');
  });

  it('metadata RU and KK', () => {
    expect(siteMetadataForLocale('ru').description).toContain('Кабинет');
    expect(siteMetadataForLocale('kk').description).toContain('кабинет');
  });

  it('hardcoded UI scanner zero outside dictionaries', () => {
    const violations = scanHardcodedBusinessWebUi(rootDir);
    expect(violations).toHaveLength(0);
  });
});
