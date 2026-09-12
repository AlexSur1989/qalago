import { describe, expect, it } from 'vitest';
import { INTENT_ACTION_LABELS, planTierLabel, reportPlacementLabel } from './labels';

describe('reporting labels', () => {
  it('canonical intent labels', () => {
    expect(INTENT_ACTION_LABELS.callClicks).toBe('Звонки');
    expect(INTENT_ACTION_LABELS.favoriteAdds).toBe('Добавления в избранное');
    expect(INTENT_ACTION_LABELS).not.toHaveProperty('favoriteRemoves');
  });

  it('ads placement labels localized', () => {
    expect(reportPlacementLabel('HOME_VIP_BANNER')).not.toBe('HOME_VIP_BANNER');
    expect(reportPlacementLabel('CATEGORY_TOP')).not.toBe('CATEGORY_TOP');
  });

  it('plan tiers', () => {
    expect(planTierLabel('BASIC')).toBe('Бизнес');
  });
});
