import { describe, expect, it } from 'vitest';
import {
  canOfferPlanPurchase,
  findPendingPlanPayment,
  isSameTierRenewal,
  listOfferedPlanPurchaseTiers,
  planPurchaseActionKind,
} from './plan-owner-ui';
import { planSameTierRenewalHint as renewalHint } from './owner-visual-copy';

describe('plan-owner-ui', () => {
  it('finds pending PlanPayment', () => {
    expect(
      findPendingPlanPayment([
        { id: '1', status: 'COMPLETED' } as never,
        { id: '2', status: 'PENDING' } as never,
      ])?.id,
    ).toBe('2');
  });

  it('FREE offers all paid tiers', () => {
    expect(listOfferedPlanPurchaseTiers('FREE')).toEqual(['BASIC', 'PREMIUM', 'VIP']);
    expect(canOfferPlanPurchase('FREE', 'BASIC', false)).toBe(true);
    expect(canOfferPlanPurchase('FREE', 'FREE', false)).toBe(false);
  });

  it('BASIC does not offer paid downgrade to FREE', () => {
    expect(canOfferPlanPurchase('BASIC', 'FREE', false)).toBe(false);
  });

  it('PREMIUM does not offer BASIC purchase while active', () => {
    expect(canOfferPlanPurchase('PREMIUM', 'BASIC', false)).toBe(false);
    expect(listOfferedPlanPurchaseTiers('PREMIUM')).toEqual(['PREMIUM', 'VIP']);
  });

  it('VIP only offers renewal', () => {
    expect(listOfferedPlanPurchaseTiers('VIP')).toEqual(['VIP']);
    expect(canOfferPlanPurchase('VIP', 'PREMIUM', false)).toBe(false);
    expect(canOfferPlanPurchase('VIP', 'VIP', false)).toBe(true);
  });

  it('blocks purchases while a payment is pending', () => {
    expect(canOfferPlanPurchase('FREE', 'BASIC', true)).toBe(false);
  });

  it('same-tier renewal action kind', () => {
    expect(isSameTierRenewal('BASIC', 'BASIC')).toBe(true);
    expect(planPurchaseActionKind('BASIC', 'BASIC')).toBe('renew');
    expect(planPurchaseActionKind('FREE', 'BASIC')).toBe('choose');
    expect(planPurchaseActionKind('BASIC', 'VIP')).toBe('upgrade');
  });

  it('same-tier renewal copy RU/KK', () => {
    expect(renewalHint('ru')).toContain('оставш');
    expect(renewalHint('kk')).toContain('қосылады');
  });
});
