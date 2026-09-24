import { resolveAnalyticsEventCityId } from './analytics-event-city.util';

describe('resolveAnalyticsEventCityId (A.9.4.1B)', () => {
  it('prefers explicit request city', () => {
    expect(
      resolveAnalyticsEventCityId({
        explicitCityId: 'city-search',
        businessLocationCityId: 'city-b',
        parentBusinessCityId: 'city-a',
      }),
    ).toBe('city-search');
  });

  it('uses businessLocation city before parent', () => {
    expect(
      resolveAnalyticsEventCityId({
        businessLocationCityId: 'city-b',
        primaryBusinessLocationCityId: 'city-a',
        parentBusinessCityId: 'city-a',
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
});
