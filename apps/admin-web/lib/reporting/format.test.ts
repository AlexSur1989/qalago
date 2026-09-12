import { describe, expect, it } from 'vitest';
import { isMetricSupported, formatCount } from './format';
import { planTierLabel } from './labels';
import { validateDateRange } from './filters';

describe('reporting format', () => {
  it('null metric is not supported', () => {
    expect(isMetricSupported(null)).toBe(false);
    expect(formatCount(null)).toBe('—');
  });

  it('plans localized correctly', () => {
    expect(planTierLabel('FREE')).toBe('Бесплатный');
    expect(planTierLabel('BASIC')).toBe('Бизнес');
    expect(planTierLabel('PREMIUM')).toBe('PRO');
    expect(planTierLabel('VIP')).toBe('VIP');
  });

  it('validates max report range', () => {
    expect(validateDateRange('2024-01-01', '2026-01-01')).toMatch(/366/);
    expect(validateDateRange('2026-01-01', '2026-01-15')).toBeNull();
  });
});
