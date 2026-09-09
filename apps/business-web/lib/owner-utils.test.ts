import { describe, expect, it } from 'vitest';
import {
  MANUAL_PAYMENT_NOTICE,
  VIP_MODERATION_NOTICE,
  VIP_PLAN_DISCLAIMER,
  buildPlanUsageSummary,
  photoPublishLabel,
  photoPublishState,
  planTierLabelRu,
} from './owner-utils';
import type { BusinessPlanStatus } from './api';

const planLimits = {
  maxPhotos: 20,
  maxServiceItems: 50,
  maxActivePromotions: 3,
  maxPromotionDurationDays: 30,
  maxPromotionsCreatedPerDay: 2,
  maxManagers: 1,
  maxAnalyticsDays: 90,
  advertisingDiscountPercent: 5,
  monthlyAdBonusKzt: 500,
  canReplyToReviews: true,
  extendedStyling: true,
  analyticsTier: 'EXTENDED' as const,
  supportPriority: 'STANDARD' as const,
  moderationPriority: 'STANDARD' as const,
  showPlanBadge: false,
};

const basePlan = (overrides?: Partial<BusinessPlanStatus>): BusinessPlanStatus => ({
  businessId: 'b1',
  tier: 'BASIC',
  effectiveTier: 'BASIC',
  expiresAt: null,
  isFeatured: false,
  featuredSlot: null,
  catalog: {
    tier: 'BASIC',
    slug: 'basic',
    nameRu: 'Бизнес',
    priceKzt: 9900,
    periodDays: 30,
    features: [],
    limits: planLimits,
  },
  limits: planLimits,
  usage: { photos: 40, serviceItems: 21, activePromotions: 2 },
  entitlements: {
    photos: { total: 40, published: 20, limit: 20, overLimit: true },
    serviceItems: { total: 21, published: 21, limit: 30, overLimit: false },
    activePromotions: { total: 2, published: 2, limit: 3, overLimit: false },
    overLimitNotice:
      'На текущем тарифе публикуется до 20 фото, 50 товаров/услуг и 3 активных акций. Остальное сохранено и доступно вам в кабинете.',
  },
  ...overrides,
});

describe('owner-utils', () => {
  it('planTierLabelRu maps tiers', () => {
    expect(planTierLabelRu('VIP')).toBe('VIP');
    expect(planTierLabelRu('BASIC')).toBe('Бизнес');
    expect(planTierLabelRu('PREMIUM')).toBe('PRO');
  });

  it('buildPlanUsageSummary shows over-limit published counts', () => {
    const lines = buildPlanUsageSummary(basePlan());
    expect(lines[0]).toContain('40 / 20');
    expect(lines[0]).toContain('опубликовано 20');
    expect(lines[1]).toContain('21 / 50');
  });

  it('photoPublishState marks hidden photos after limit', () => {
    const plan = basePlan();
    expect(photoPublishState(0, plan)).toBe('published');
    expect(photoPublishState(19, plan)).toBe('published');
    expect(photoPublishState(20, plan)).toBe('hidden');
    expect(photoPublishLabel('hidden')).toBe('Не публикуется по лимиту тарифа');
  });

  it('VIP and payment notices are owner-friendly', () => {
    expect(MANUAL_PAYMENT_NOTICE).toContain('администратором');
    expect(VIP_MODERATION_NOTICE).toContain('одобрен');
    expect(VIP_PLAN_DISCLAIMER).toContain('отдельно');
  });

  it('promotion advertising CTA uses monetization flow', () => {
    const ctaPath = '/monetization/products/PROMOTED_PROMOTION';
    expect(ctaPath).not.toContain('/promote');
    expect(ctaPath).toContain('PROMOTED_PROMOTION');
  });
});
