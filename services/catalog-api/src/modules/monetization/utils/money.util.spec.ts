import { calcDiscountAmount, calcFinalPrice } from './money.util';

describe('money.util', () => {
  it('9. integer rounding for discount', () => {
    expect(calcDiscountAmount(990, 10)).toBe(99);
    expect(calcFinalPrice(990, 10)).toBe(891);
    expect(calcDiscountAmount(1001, 15)).toBe(150);
    expect(calcFinalPrice(1001, 15)).toBe(851);
  });
});
