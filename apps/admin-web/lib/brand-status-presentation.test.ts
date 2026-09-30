import { describe, expect, it } from 'vitest';
import {
  businessStatusPresentation,
  featureFlagPresentation,
  planTierPresentation,
} from '@qalago/brand/status';

describe('@qalago/brand/status (UXA.7)', () => {
  it('maps business statuses without raw enum labels', () => {
    expect(businessStatusPresentation('PENDING').label).toBe('На модерации');
    expect(businessStatusPresentation('UNKNOWN_X').label).toBe('Неизвестный статус');
    expect(businessStatusPresentation('UNKNOWN_X').label).not.toContain('_');
  });

  it('maps feature flags', () => {
    expect(featureFlagPresentation(true).tone).toBe('success');
    expect(featureFlagPresentation(false).label).toBe('Выключено');
  });

  it('preserves canonical plan tier public names', () => {
    expect(planTierPresentation('BASIC').label).toBe('BUSINESS');
    expect(planTierPresentation('PREMIUM').label).toBe('PRO');
    expect(planTierPresentation('FREE').label).toBe('Бесплатный');
  });
});
