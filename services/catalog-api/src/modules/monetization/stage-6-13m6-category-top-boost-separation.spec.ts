/**
 * 6.13M.6 — CATEGORY_TOP / CATEGORY_BOOST remain distinct placements in serving contract.
 * Presentation separation is implemented in consumer-web + mobile; backend unchanged.
 */
import {
  PRODUCT_PLACEMENT_MAP,
  SERVING_PLACEMENT_CODES,
} from './constants/monetization.constants';
import { MonetizationProductType } from '@prisma/client';

describe('6.13M.6 category TOP vs BOOST separation (contract)', () => {
  it('maps TOP_CATEGORY and BOOST to different placement codes', () => {
    expect(PRODUCT_PLACEMENT_MAP[MonetizationProductType.TOP_CATEGORY]).toBe(
      'CATEGORY_TOP',
    );
    expect(PRODUCT_PLACEMENT_MAP[MonetizationProductType.BOOST]).toBe(
      'CATEGORY_BOOST',
    );
  });

  it('serves both category placements', () => {
    expect(SERVING_PLACEMENT_CODES).toContain('CATEGORY_TOP');
    expect(SERVING_PLACEMENT_CODES).toContain('CATEGORY_BOOST');
  });
});
