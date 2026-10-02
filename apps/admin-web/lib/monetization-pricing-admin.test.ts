import { describe, expect, it } from 'vitest';
import {
  parseAdminProductPriceAmount,
  validateAdminProductPriceAmount,
} from './monetization-utils';

describe('monetization pricing admin helpers', () => {
  it('parses positive integer KZT amounts', () => {
    expect(parseAdminProductPriceAmount('10000')).toBe(10000);
    expect(parseAdminProductPriceAmount(' 12 000 ')).toBe(12000);
  });

  it('rejects invalid amounts', () => {
    expect(parseAdminProductPriceAmount('')).toBeNull();
    expect(parseAdminProductPriceAmount('0')).toBeNull();
    expect(parseAdminProductPriceAmount('-5')).toBeNull();
    expect(parseAdminProductPriceAmount('10.5')).toBeNull();
  });

  it('validateAdminProductPriceAmount returns Russian error messages', () => {
    expect(validateAdminProductPriceAmount(null)).toMatch(/KZT/);
    expect(validateAdminProductPriceAmount(5000)).toBeNull();
  });
});
