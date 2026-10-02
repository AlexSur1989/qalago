/**
 * Stage 0 — monetization / plans baseline invariants (read-only contract tests).
 * No production behavior changes; documents architecture guards for later stages.
 */
import { AnalyticsEventType, BusinessPlanTier, MonetizationProductType } from '@prisma/client';
import { PLAN_CATALOG } from '../../common/services/plan-limits.service';
import {
  compareBusinessCatalogRank,
  compareBusinessTierRank,
  resolveEffectivePlanTier,
} from '../../common/utils/business-rank.util';
import {
  AD_ANALYTICS_EVENT_TYPES,
  INACTIVE_SERVING_PLACEMENTS,
  PRODUCT_PLACEMENT_MAP,
  SERVING_PLACEMENT_CODES,
} from './constants/monetization.constants';

describe('Stage 0 — monetization baseline invariants', () => {
  describe('A. PLAN catalog and ranking', () => {
    it('defines FREE, BASIC, PREMIUM, VIP in PLAN_CATALOG', () => {
      const tiers = PLAN_CATALOG.map((p) => p.tier).sort();
      expect(tiers).toEqual([
        BusinessPlanTier.BASIC,
        BusinessPlanTier.FREE,
        BusinessPlanTier.PREMIUM,
        BusinessPlanTier.VIP,
      ]);
    });

    it('paid plan tier does not affect organic tier rank comparator', () => {
      expect(
        compareBusinessTierRank(
          { planTier: BusinessPlanTier.VIP, planExpiresAt: null, isFeatured: true, featuredSlot: 1 },
          { planTier: BusinessPlanTier.FREE, planExpiresAt: null, isFeatured: false, featuredSlot: null },
        ),
      ).toBe(0);
    });

    it('organic catalog rank uses title only', () => {
      expect(
        compareBusinessCatalogRank(
          { planTier: BusinessPlanTier.VIP, planExpiresAt: null, isFeatured: true, featuredSlot: 1, title: 'Beta' },
          { planTier: BusinessPlanTier.FREE, planExpiresAt: null, isFeatured: false, featuredSlot: null, title: 'Alpha' },
        ),
      ).toBeGreaterThan(0);
    });

    it('expired paid plan resolves to FREE for enforcement', () => {
      expect(
        resolveEffectivePlanTier({
          planTier: BusinessPlanTier.PREMIUM,
          planExpiresAt: new Date('2020-01-01'),
        }),
      ).toBe(BusinessPlanTier.FREE);
    });
  });

  describe('B. VIP plan ≠ HOME_VIP_BANNER product', () => {
    it('maps VIP_BANNER monetization product to HOME_VIP_BANNER placement only', () => {
      expect(PRODUCT_PLACEMENT_MAP[MonetizationProductType.VIP_BANNER]).toBe('HOME_VIP_BANNER');
    });

    it('does not map any BusinessPlanTier to an ad placement', () => {
      const placementValues = new Set(Object.values(PRODUCT_PLACEMENT_MAP));
      for (const tier of Object.values(BusinessPlanTier)) {
        expect(placementValues.has(tier)).toBe(false);
      }
    });

    it('serving placements include all five active consumer placements', () => {
      expect([...SERVING_PLACEMENT_CODES].sort()).toEqual(
        [
          'CATEGORY_BOOST',
          'CATEGORY_TOP',
          'HOME_FEATURED',
          'HOME_PROMOTIONS',
          'HOME_VIP_BANNER',
        ].sort(),
      );
    });

    it('SEARCH_TOP and MAP_FEATURED are explicitly inactive for serving', () => {
      expect(INACTIVE_SERVING_PLACEMENTS).toEqual(['SEARCH_TOP', 'MAP_FEATURED']);
      for (const code of INACTIVE_SERVING_PLACEMENTS) {
        expect(SERVING_PLACEMENT_CODES as readonly string[]).not.toContain(code);
      }
    });
  });

  describe('C. Product ↔ placement map (ads engine contract)', () => {
    it('maps each advertising product type to expected placement code', () => {
      expect(PRODUCT_PLACEMENT_MAP[MonetizationProductType.BOOST]).toBe('CATEGORY_BOOST');
      expect(PRODUCT_PLACEMENT_MAP[MonetizationProductType.TOP_CATEGORY]).toBe('CATEGORY_TOP');
      expect(PRODUCT_PLACEMENT_MAP[MonetizationProductType.FEATURED_BUSINESS]).toBe('HOME_FEATURED');
      expect(PRODUCT_PLACEMENT_MAP[MonetizationProductType.PROMOTED_PROMOTION]).toBe('HOME_PROMOTIONS');
      expect(PRODUCT_PLACEMENT_MAP[MonetizationProductType.VIP_BANNER]).toBe('HOME_VIP_BANNER');
      expect(PRODUCT_PLACEMENT_MAP[MonetizationProductType.PACKAGE]).toBeUndefined();
    });
  });

  describe('D. Analytics event separation (AD_SERVED vs client AD_IMPRESSION)', () => {
    it('AD_SERVED exists as distinct AnalyticsEventType from AD_IMPRESSION', () => {
      expect(AnalyticsEventType.AD_SERVED).toBe('AD_SERVED');
      expect(AnalyticsEventType.AD_IMPRESSION).toBe('AD_IMPRESSION');
      expect(AnalyticsEventType.AD_SERVED).not.toBe(AnalyticsEventType.AD_IMPRESSION);
    });

    it('client-trackable ad events exclude AD_SERVED', () => {
      expect(AD_ANALYTICS_EVENT_TYPES).toContain('AD_IMPRESSION');
      expect(AD_ANALYTICS_EVENT_TYPES).toContain('AD_CLICK');
      expect(AD_ANALYTICS_EVENT_TYPES as readonly string[]).not.toContain('AD_SERVED');
    });
  });

  describe('E. Promotion content vs PROMOTED_PROMOTION ad product', () => {
    it('PROMOTED_PROMOTION is a monetization product type, not a Promotion status', () => {
      expect(MonetizationProductType.PROMOTED_PROMOTION).toBe('PROMOTED_PROMOTION');
      expect(Object.values(MonetizationProductType)).toContain('PROMOTED_PROMOTION');
    });

    it('organic promotion model is separate from PROMOTED_PROMOTION product (schema comment contract)', () => {
      // Promotion entity is not in MonetizationProductType enum.
      const productTypes = Object.values(MonetizationProductType);
      expect(productTypes).not.toContain('ACTIVE');
      expect(productTypes).not.toContain('DRAFT');
    });
  });
});
