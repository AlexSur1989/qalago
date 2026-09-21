import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BusinessPermission,
  buildMainNavItems,
  filterNavByAccess,
} from './business-access';
import { cityDisplayName } from './localized-content';
import {
  formatOwnerDateTime,
  formatReviewsCountLabel,
  navLabelForId,
  onboardingRejectionReasonLabel,
  organicPromotionStatusLabel,
  ownerDateTimeLocaleTag,
  planAnalytics360Label,
} from './presentation';
import { UI_LABELS } from './locale';

describe('notifications naming (6.10D.2)', () => {
  it('uses RU/KK notification labels in locale bundle', () => {
    expect(UI_LABELS.ru.ownerNavMessages).toBe('Уведомления');
    expect(UI_LABELS.kk.ownerNavMessages).toBe('Хабарландырулар');
  });

  it('keeps /messages route in messages page', () => {
    const src = readFileSync(join(process.cwd(), 'app/messages/page.tsx'), 'utf8');
    expect(src).toContain('activeNav="messages"');
    expect(src).not.toContain('href="/notifications"');
  });

  it('formats notification dates with locale tag helper', () => {
    expect(ownerDateTimeLocaleTag('ru')).toBe('ru-RU');
    expect(ownerDateTimeLocaleTag('kk')).toBe('kk-KZ');
    const formatted = formatOwnerDateTime('ru', '2026-01-15T12:00:00.000Z');
    expect(formatted.length).toBeGreaterThan(5);
  });
});

describe('promotion status presentation (6.10D.2)', () => {
  it('localizes known organic promotion statuses', () => {
    expect(organicPromotionStatusLabel('ru', 'ACTIVE')).toBe('Активна');
    expect(organicPromotionStatusLabel('ru', 'EXPIRED')).toBe('Завершена');
    expect(organicPromotionStatusLabel('ru', 'DRAFT')).toBe('Черновик');
    expect(organicPromotionStatusLabel('ru', 'ARCHIVED')).toBe('В архиве');
  });

  it('does not echo raw enum for unknown status', () => {
    expect(organicPromotionStatusLabel('ru', 'MYSTERY_STATUS')).not.toBe('MYSTERY_STATUS');
  });

  it('promotions page uses status label helper', () => {
    const src = readFileSync(
      join(process.cwd(), 'app/business/[id]/promotions/page.tsx'),
      'utf8',
    );
    expect(src).toContain('organicPromotionStatusLabel');
    expect(src).not.toMatch(/\{p\.status === 'ACTIVE' \? ui\.text_047e75 : p\.status\}/);
  });
});

describe('reviews and onboarding localization (6.10D.2)', () => {
  it('formats reviews count in RU/KK', () => {
    expect(formatReviewsCountLabel('ru', 5)).toContain('отзыв');
    expect(formatReviewsCountLabel('kk', 3)).toContain('пікір');
  });

  it('city display respects KK with RU fallback', () => {
    expect(cityDisplayName({ nameRu: 'Уральск', nameKk: 'Орал' }, 'kk')).toBe('Орал');
    expect(cityDisplayName({ nameRu: 'Уральск', nameKk: '' }, 'kk')).toBe('Уральск');
  });

  it('localizes rejection reason label', () => {
    expect(onboardingRejectionReasonLabel('ru')).toBe('Причина:');
    expect(onboardingRejectionReasonLabel('kk')).toBe('Себебі:');
  });
});

describe('plan analytics label (6.10D.2)', () => {
  it('localizes Analytics 360 capability label', () => {
    expect(planAnalytics360Label('ru')).toBe('Аналитика 360');
    expect(planAnalytics360Label('kk')).toContain('360');
  });
});

describe('media/reviews nav discoverability (6.10D.2)', () => {
  const owner = { role: 'OWNER' as const, permissions: [] };
  const photosManager = {
    role: 'MANAGER' as const,
    permissions: [BusinessPermission.PHOTOS_EDIT],
  };
  const reviewsManager = {
    role: 'MANAGER' as const,
    permissions: [BusinessPermission.REVIEWS_REPLY],
  };
  const catalogOnly = {
    role: 'MANAGER' as const,
    permissions: [BusinessPermission.CATALOG_EDIT],
  };

  it('shows media nav for PHOTOS_EDIT and builds business href', () => {
    const media = filterNavByAccess(buildMainNavItems('ru'), photosManager).find(
      (i) => i.id === 'media',
    );
    expect(media).toBeDefined();
    expect(media?.href?.('biz-1')).toBe('/business/biz-1/media');
  });

  it('hides media nav without PHOTOS_EDIT', () => {
    const nav = filterNavByAccess(buildMainNavItems('ru'), catalogOnly);
    expect(nav.some((i) => i.id === 'media')).toBe(false);
  });

  it('shows reviews nav for REVIEWS_REPLY', () => {
    const reviews = filterNavByAccess(buildMainNavItems('ru'), reviewsManager).find(
      (i) => i.id === 'reviews',
    );
    expect(reviews).toBeDefined();
    expect(reviews?.href?.('biz-2')).toBe('/business/biz-2/reviews');
  });

  it('owner sees media and reviews entries', () => {
    const nav = filterNavByAccess(buildMainNavItems('ru'), owner);
    expect(nav.some((i) => i.id === 'media')).toBe(true);
    expect(nav.some((i) => i.id === 'reviews')).toBe(true);
  });

  it('nav labels use localized notification naming', () => {
    expect(navLabelForId('ru', 'messages')).toBe('Уведомления');
    expect(navLabelForId('kk', 'messages')).toBe('Хабарландырулар');
    expect(navLabelForId('ru', 'locations')).toBe('Филиалы');
    expect(navLabelForId('kk', 'locations')).toBe('Филиалдар');
  });
});
