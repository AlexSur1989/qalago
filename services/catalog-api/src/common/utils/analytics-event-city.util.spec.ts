import { resolveAnalyticsEventCityId } from './analytics-event-city.util';

describe('resolveAnalyticsEventCityId (A.9.4.1B / A.9.4.5B)', () => {
  it('prefers explicit request city', () => {
    expect(
      resolveAnalyticsEventCityId({
        explicitCityId: 'city-search',
        businessLocationCityId: 'city-b',
      }),
    ).toBe('city-search');
  });

  it('uses businessLocation city before primary', () => {
    expect(
      resolveAnalyticsEventCityId({
        businessLocationCityId: 'city-b',
        primaryBusinessLocationCityId: 'city-a',
      }),
    ).toBe('city-b');
  });

  it('uses campaign city when no branch context', () => {
    expect(
      resolveAnalyticsEventCityId({
        campaignCityId: 'city-c',
        primaryBusinessLocationCityId: 'city-a',
      }),
    ).toBe('city-c');
  });

  it('returns undefined when no context (no Business.cityId fallback)', () => {
    expect(resolveAnalyticsEventCityId({})).toBeUndefined();
    expect(
      resolveAnalyticsEventCityId({
        primaryBusinessLocationCityId: null,
      }),
    ).toBeUndefined();
  });

  it('L1-specific branch city wins over primary after promotion', () => {
    expect(
      resolveAnalyticsEventCityId({
        businessLocationCityId: 'city-a',
        primaryBusinessLocationCityId: 'city-b',
      }),
    ).toBe('city-a');
  });
});
