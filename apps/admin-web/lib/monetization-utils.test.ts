import { describe, expect, it } from 'vitest';
import {
  MONETIZATION_SUBNAV_HREFS,
  campaignActionsForStatus,
  campaignStatusLabel,
  canConfirmPayment,
  creativeStatusLabel,
  formatCtr,
  formatKzt,
  orderStatusLabel,
  paymentStatusLabel,
  placementLabel,
  productLabel,
} from './monetization-utils';

describe('monetization-utils', () => {
  it('formats KZT', () => {
    expect(formatKzt(4900)).toContain('4');
    expect(formatKzt(4900)).toContain('₸');
  });

  it('formats CTR', () => {
    expect(formatCtr(15.4)).toBe('15,4%');
  });

  it('maps product labels (6.13M.1)', () => {
    expect(productLabel('TOP_CATEGORY')).toBe('ТОП категории');
    expect(productLabel('VIP_BANNER')).toBe('Баннер на главной');
    expect(productLabel('VIP_BANNER')).not.toBe('VIP-баннер');
  });

  it('maps placement labels (6.13M.1)', () => {
    expect(placementLabel('HOME_VIP_BANNER')).toBe('Баннер на главной');
    expect(placementLabel('CATEGORY_BOOST')).toBe('Продвижение в категории');
  });

  it('exposes plan payments in monetization subnav (6.13M.4A)', () => {
    expect(MONETIZATION_SUBNAV_HREFS).toContain('/plans/payments');
  });

  it('maps order statuses', () => {
    expect(orderStatusLabel('AWAITING_PAYMENT')).toBe('Ожидает оплаты');
    expect(orderStatusLabel('PAID')).toBe('Оплачен');
  });

  it('maps payment statuses', () => {
    expect(paymentStatusLabel('PENDING')).toBe('Ожидает');
    expect(paymentStatusLabel('PAID')).toBe('Оплачен');
  });

  it('maps campaign statuses', () => {
    expect(campaignStatusLabel('ACTIVE')).toBe('Активно');
    expect(campaignStatusLabel('SCHEDULED')).toBe('Запланировано');
  });

  it('maps creative statuses', () => {
    expect(creativeStatusLabel('PENDING')).toBe('На модерации');
  });

  it('campaign actions matrix', () => {
    expect(campaignActionsForStatus('ACTIVE')).toEqual(['pause', 'cancel']);
    expect(campaignActionsForStatus('PAUSED')).toEqual(['resume', 'cancel']);
    expect(campaignActionsForStatus('COMPLETED')).toEqual([]);
  });

  it('payment confirm eligibility', () => {
    expect(canConfirmPayment('PENDING', 'MANUAL')).toBe(true);
    expect(canConfirmPayment('PAID', 'MANUAL')).toBe(false);
    expect(canConfirmPayment('PENDING', 'KASPI')).toBe(false);
  });
});
