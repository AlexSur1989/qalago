import { describe, expect, it } from 'vitest';
import {
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

  it('maps product labels', () => {
    expect(productLabel('TOP_CATEGORY')).toBe('TOP категории');
    expect(productLabel('VIP_BANNER')).toBe('VIP-баннер');
  });

  it('maps placement labels', () => {
    expect(placementLabel('HOME_VIP_BANNER')).toBe('VIP-баннер на главной');
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
