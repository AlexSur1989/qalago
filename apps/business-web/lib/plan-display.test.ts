import { describe, expect, it } from 'vitest';
import { internalTierToPublicLabel } from '@/lib/plan-display';

describe('plan display mapping (BIZ.7)', () => {
  it('maps storage tiers to canonical RU labels (no BASIC/PREMIUM leak)', () => {
    expect(internalTierToPublicLabel('BASIC')).toBe('Бизнес');
    expect(internalTierToPublicLabel('PREMIUM')).toBe('PRO');
    expect(internalTierToPublicLabel('VIP')).toBe('VIP');
    expect(internalTierToPublicLabel('FREE')).toBe('Бесплатный');
  });
});
