import { describe, expect, it } from 'vitest';
import {
  analyticsActionLabel,
  campaignStatusLabel,
  canSubmitCreative,
  creativeStatusLabel,
  formatDuration,
  formatEffectivePeriod,
  formatKzt,
  orderStatusLabel,
  packageHasVip,
  paymentStatusLabel,
  placementLabel,
  planTierLabel,
  productLabel,
  productOwnerDescription,
  vipCampaignDisplayStatus,
  vipModerationNotice,
} from './monetization-utils';
import { adPackagesNotSubscriptionPlans } from './owner-visual-copy';
import { filterProductsByPromoteSubject } from './monetization-owner-ui';

const ru = 'ru' as const;

describe('monetization-utils', () => {
  it('formats KZT', () => {
    expect(formatKzt(4900)).toContain('4');
    expect(formatKzt(4900)).toContain('₸');
  });

  it('formats duration', () => {
    expect(formatDuration(ru, 1, null)).toBe('1 день');
    expect(formatDuration(ru, 3, null)).toBe('3 дня');
    expect(formatDuration(ru, 7, null)).toBe('7 дней');
  });

  const kk = 'kk' as const;

  const OWNER_PLACEMENT_RU: Record<string, string> = {
    HOME_VIP_BANNER: 'Баннер на главной',
    HOME_FEATURED: 'Продвижение на главной',
    HOME_PROMOTIONS: 'Продвижение акции',
    CATEGORY_TOP: 'ТОП категории',
    CATEGORY_BOOST: 'Продвижение в категории',
  };

  const OWNER_PLACEMENT_KK: Record<string, string> = {
    HOME_VIP_BANNER: 'Басты бетте баннер',
    HOME_FEATURED: 'Басты бетте ілгерілету',
    HOME_PROMOTIONS: 'Акцияны насихаттау',
    CATEGORY_TOP: 'Санатта ТОП',
    CATEGORY_BOOST: 'Санатта ілгерілету',
  };

  it('maps owner product labels (6.13M.1)', () => {
    expect(productLabel(ru, 'VIP_BANNER')).toBe('Баннер на главной');
    expect(productLabel(ru, 'FEATURED_BUSINESS')).toBe('Продвижение на главной');
    expect(productLabel(kk, 'VIP_BANNER')).toBe('Басты бетте баннер');
    expect(productLabel(ru, 'VIP_BANNER')).not.toContain('HOME_VIP_BANNER');
  });

  it('maps all five owner placement labels RU/KK', () => {
    for (const [code, label] of Object.entries(OWNER_PLACEMENT_RU)) {
      expect(placementLabel(ru, code)).toBe(label);
      expect(placementLabel(ru, code, 'VIP баннер на главной из seed')).toBe(label);
    }
    for (const [code, label] of Object.entries(OWNER_PLACEMENT_KK)) {
      expect(placementLabel(kk, code)).toBe(label);
    }
  });

  it('falls back to custom placement name for unknown codes', () => {
    expect(placementLabel(ru, 'CUSTOM', 'Кастомное место')).toBe('Кастомное место');
  });

  it('maps order statuses', () => {
    expect(orderStatusLabel(ru, 'AWAITING_PAYMENT')).toBe('Ожидает оплаты');
    expect(orderStatusLabel(ru, 'PAID')).toBe('Оплачен');
  });

  it('maps payment statuses', () => {
    expect(paymentStatusLabel(ru, 'PENDING')).toBe('Ожидает');
    expect(paymentStatusLabel(ru, 'PAID')).toBe('Оплачен');
  });

  it('maps owner campaign statuses (feminine)', () => {
    expect(campaignStatusLabel(ru, 'ACTIVE')).toBe('Активна');
    expect(campaignStatusLabel(ru, 'SCHEDULED')).toBe('Запланирована');
    expect(campaignStatusLabel(ru, 'COMPLETED')).toBe('Завершена');
    expect(campaignStatusLabel(ru, 'PAUSED')).toBe('Приостановлена');
    expect(campaignStatusLabel(ru, 'CANCELLED')).toBe('Отменена');
    expect(campaignStatusLabel(ru, 'PENDING_MODERATION')).toBe('На модерации');
  });

  it('maps creative statuses', () => {
    expect(creativeStatusLabel(ru, 'PENDING')).toBe('На модерации');
    expect(creativeStatusLabel(ru, 'APPROVED')).toBe('Одобрено');
    expect(creativeStatusLabel(ru, 'REJECTED')).toBe('Отклонено');
  });

  it('maps plan tiers', () => {
    expect(planTierLabel(ru, 'PREMIUM')).toBe('PRO');
    expect(planTierLabel(ru, 'BASIC')).toBe('Бизнес');
    expect(planTierLabel(ru, 'VIP')).toBe('VIP');
  });

  it('maps analytics actions', () => {
    expect(analyticsActionLabel(ru, 'AD_CALL_CLICK')).toBe('Звонки');
  });

  it('VIP DRAFT shows awaiting submit, not moderation', () => {
    expect(
      vipCampaignDisplayStatus(ru, {
        status: 'SCHEDULED',
        product: { code: 'VIP_BANNER' },
        creative: { moderationStatus: 'DRAFT' },
      }),
    ).toBe('Ожидает отправки креатива');
    expect(
      vipModerationNotice(ru, {
        status: 'SCHEDULED',
        creative: { moderationStatus: 'DRAFT' },
      }),
    ).toContain('Отправьте креатив');
  });

  it('VIP PENDING shows moderation state', () => {
    expect(
      vipCampaignDisplayStatus(ru, {
        status: 'PENDING_MODERATION',
        product: { code: 'VIP_BANNER' },
        creative: { moderationStatus: 'PENDING' },
      }),
    ).toBe('На модерации');
  });

  it('canSubmitCreative only for DRAFT/REJECTED', () => {
    expect(canSubmitCreative({ moderationStatus: 'DRAFT' })).toBe(true);
    expect(canSubmitCreative({ moderationStatus: 'PENDING' })).toBe(false);
    expect(canSubmitCreative({ moderationStatus: 'APPROVED' })).toBe(false);
  });

  it('formatEffectivePeriod before approval', () => {
    expect(
      formatEffectivePeriod(ru, {
        startAt: '2026-09-09T00:00:00Z',
        endAt: '2026-10-09T00:00:00Z',
        effectivePeriodStarted: false,
      }),
    ).toBe('Начнётся после одобрения');
  });

  it('provides owner product descriptions without raw placement codes', () => {
    expect(productOwnerDescription(ru, 'VIP_BANNER')).toContain('главн');
    expect(productOwnerDescription(kk, 'BOOST')).toMatch(/[Сс]анат/);
    expect(productLabel(ru, 'VIP_BANNER')).not.toMatch(/HOME_VIP_BANNER/);
  });

  it('labels ad packages distinct from subscription plans RU/KK', () => {
    expect(adPackagesNotSubscriptionPlans('ru')).toContain('не подписка');
    expect(adPackagesNotSubscriptionPlans('kk')).toContain('емес');
  });

  it('filters products by promote subject', () => {
    const products = [
      { code: 'VIP_BANNER' },
      { code: 'PROMOTED_PROMOTION' },
      { code: 'BOOST' },
    ];
    expect(filterProductsByPromoteSubject(products, 'business').map((p) => p.code)).toEqual([
      'VIP_BANNER',
      'BOOST',
    ]);
    expect(filterProductsByPromoteSubject(products, 'promotion').map((p) => p.code)).toEqual([
      'PROMOTED_PROMOTION',
    ]);
  });

  it('detects VIP in package', () => {
    expect(
      packageHasVip({
        items: [{ productCode: 'BOOST', productName: 'Boost', productType: 'BOOST', quantity: 1 }],
      }),
    ).toBe(false);
    expect(
      packageHasVip({
        items: [
          {
            productCode: 'VIP_BANNER',
            productName: 'VIP',
            productType: 'VIP_BANNER',
            quantity: 1,
          },
        ],
      }),
    ).toBe(true);
  });
});
