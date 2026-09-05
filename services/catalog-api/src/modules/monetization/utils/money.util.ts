/**
 * Integer KZT money helpers. Discount uses Math.round (half-up for positive values).
 */
export function calcDiscountAmount(
  basePrice: number,
  discountPercent: number,
): number {
  return Math.round((basePrice * discountPercent) / 100);
}

export function calcFinalPrice(
  basePrice: number,
  discountPercent: number,
): number {
  return basePrice - calcDiscountAmount(basePrice, discountPercent);
}

export function sumFinalPrices(prices: number[]): number {
  return prices.reduce((acc, p) => acc + p, 0);
}
