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
  vipCampaignDisplayStatus,
  vipModerationNotice,
} from './monetization-utils';

describe('monetization-utils', () => {
  it('formats KZT', () => {
    expect(formatKzt(4900)).toContain('4');
    expect(formatKzt(4900)).toContain('₸');
  });

  it('formats duration', () => {
    expect(formatDuration(1, null)).toBe('1 день');
    expect(formatDuration(3, null)).toBe('3 дня');
    expect(formatDuration(7, null)).toBe('7 дней');
  });

  it('maps product labels', () => {
    expect(productLabel('TOP_CATEGORY')).toBe('TOP категории');
    expect(productLabel('VIP_BANNER')).toBe('VIP-баннер');
  });

  it('maps placement labels', () => {
    expect(placementLabel('HOME_VIP_BANNER')).toBe('VIP-баннер на главной');
    expect(placementLabel('CUSTOM', 'Кастомное место')).toBe('Кастомное место');
  });

  it('maps order statuses', () => {
    expect(orderStatusLabel('AWAITING_PAYMENT')).toBe('Ожидает оплаты');
    expect(orderStatusLabel('PAID')).toBe('Оплачен');
  });

  it('maps payment statuses', () => {
    expect(paymentStatusLabel('PENDING')).toBe('Ожидает');
    expect(paymentStatusLabel('PAID')).toBe('Оплачен');
  });

  it('maps owner campaign statuses (feminine)', () => {
    expect(campaignStatusLabel('ACTIVE')).toBe('Активна');
    expect(campaignStatusLabel('SCHEDULED')).toBe('Запланирована');
    expect(campaignStatusLabel('COMPLETED')).toBe('Завершена');
    expect(campaignStatusLabel('PAUSED')).toBe('Приостановлена');
    expect(campaignStatusLabel('CANCELLED')).toBe('Отменена');
    expect(campaignStatusLabel('PENDING_MODERATION')).toBe('На модерации');
  });

  it('maps creative statuses', () => {
    expect(creativeStatusLabel('PENDING')).toBe('На модерации');
    expect(creativeStatusLabel('APPROVED')).toBe('Одобрено');
    expect(creativeStatusLabel('REJECTED')).toBe('Отклонено');
  });

  it('maps plan tiers', () => {
    expect(planTierLabel('PREMIUM')).toBe('PRO');
    expect(planTierLabel('BASIC')).toBe('Бизнес');
    expect(planTierLabel('VIP')).toBe('VIP');
  });

  it('maps analytics actions', () => {
    expect(analyticsActionLabel('AD_CALL_CLICK')).toBe('Звонки');
  });

  it('VIP DRAFT shows awaiting submit, not moderation', () => {
    expect(
      vipCampaignDisplayStatus({
        status: 'SCHEDULED',
        product: { code: 'VIP_BANNER' },
        creative: { moderationStatus: 'DRAFT' },
      }),
    ).toBe('Ожидает отправки креатива');
    expect(
      vipModerationNotice({
        status: 'SCHEDULED',
        product: { code: 'VIP_BANNER' },
        creative: { moderationStatus: 'DRAFT' },
      }),
    ).toContain('Отправьте креатив');
  });

  it('VIP PENDING shows moderation state', () => {
    expect(
      vipCampaignDisplayStatus({
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
      formatEffectivePeriod({
        startAt: '2026-09-09T00:00:00Z',
        endAt: '2026-10-09T00:00:00Z',
        effectivePeriodStarted: false,
      }),
    ).toBe('Начнётся после одобрения');
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
