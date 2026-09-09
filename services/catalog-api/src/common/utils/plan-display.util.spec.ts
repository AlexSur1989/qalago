import { BusinessPlanTier } from '@prisma/client';
import {
  getPlanDisplayMetadata,
  internalTierToPublicLabel,
  publicPlanLabelRu,
} from './plan-display.util';

describe('plan-display.util', () => {
  it('maps internal tiers to public display metadata', () => {
    expect(getPlanDisplayMetadata(BusinessPlanTier.FREE)).toEqual({
      publicCode: 'FREE',
      nameKey: 'plan.free',
      nameRu: 'Бесплатный',
    });
    expect(getPlanDisplayMetadata(BusinessPlanTier.BASIC).publicCode).toBe('BUSINESS');
    expect(getPlanDisplayMetadata(BusinessPlanTier.PREMIUM).publicCode).toBe('PRO');
    expect(getPlanDisplayMetadata(BusinessPlanTier.VIP).nameRu).toBe('VIP');
  });

  it('labels legacy enum values for admin/history', () => {
    expect(internalTierToPublicLabel('BASIC')).toBe('Бизнес');
    expect(internalTierToPublicLabel('PREMIUM')).toBe('PRO');
    expect(publicPlanLabelRu(BusinessPlanTier.BASIC)).toBe('Бизнес');
  });
});
