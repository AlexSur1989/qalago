import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { UI_LABELS } from './locale';
import { planTierLabel } from './presentation';
import {
  analyticsPeriodDaysLabel,
  planCurrentTierTitle,
  planFeaturePhotosLine,
} from './owner-visual-copy';

describe('UXA.12 canonical terminology', () => {
  it('plan tiers RU/KK (FREE/BUSINESS/PRO/VIP)', () => {
    expect(planTierLabel('ru', 'FREE')).toBe('Бесплатный');
    expect(planTierLabel('kk', 'FREE')).toBe('Тегін');
    expect(planTierLabel('ru', 'BASIC')).toBe('Бизнес');
    expect(planTierLabel('ru', 'VIP')).toBe('VIP');
  });

  it('primary branch badge RU/KK', () => {
    expect(UI_LABELS.ru.branchAvailabilityPrimaryBadge).toBe('Основной филиал');
    expect(UI_LABELS.kk.branchAvailabilityPrimaryBadge).toBe('Негізгі филиал');
  });

  it('plan feature lines interpolate max count (UXA.13 physical QA)', () => {
    expect(planFeaturePhotosLine('ru', 100)).toBe('Фото: 100');
    expect(planFeaturePhotosLine('kk', 100)).toBe('Фото: 100');
    expect(planFeaturePhotosLine('kk', 100)).not.toContain('${');
  });

  it('owner visual copy helpers localize analytics period', () => {
    expect(analyticsPeriodDaysLabel('ru', 7)).toContain('7');
    expect(analyticsPeriodDaysLabel('kk', 7)).toContain('7');
    expect(analyticsPeriodDaysLabel('kk', 7)).not.toMatch(/Период:/);
  });

  it('messages load error uses dictionary keys', () => {
    expect(UI_LABELS.ru.ownerMessagesLoadError.length).toBeGreaterThan(5);
    expect(UI_LABELS.kk.ownerMessagesLoadError).toContain('Хабарландыру');
  });

  it('UXA.13 physical QA: login and dashboard KK strings differ from RU', () => {
    const keys = [
      '____c8191d',
      '___c1d1fc',
      '__79b074',
      '__7__0205a6',
      '__bb49cc',
      '__a144ec',
      '___ee3b0e',
      '__591eff',
      '__19c279',
    ] as const;
    for (const key of keys) {
      expect(UI_LABELS.kk[key]).not.toBe(UI_LABELS.ru[key]);
    }
  });
});

describe('UXA.12 wiring contracts', () => {
  const root = join(process.cwd());

  it('imports backoffice-i18n.css in Business globals', () => {
    const css = readFileSync(join(root, 'app/globals.css'), 'utf8');
    expect(css).toContain('backoffice-i18n.css');
  });

  it('analytics dashboard uses owner-visual-copy', () => {
    const src = readFileSync(join(root, 'components/analytics-360-dashboard.tsx'), 'utf8');
    expect(src).toContain('owner-visual-copy');
    expect(src).not.toMatch(/Период: \{dashboard/);
  });

  it('plan page uses localized tier title helper', () => {
    const src = readFileSync(join(root, 'app/plan/page.tsx'), 'utf8');
    expect(src).toContain('planCurrentTierTitle');
    expect(planCurrentTierTitle('kk', 'PRO').startsWith('Ағымдағы')).toBe(true);
  });
});
