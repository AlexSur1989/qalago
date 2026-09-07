import { BusinessTrafficSource } from '@prisma/client';
import { aggregateTrafficSources } from './business-traffic-source.util';

describe('aggregateTrafficSources', () => {
  it('groups known sources with percentages summing to 100', () => {
    const result = aggregateTrafficSources([
      { trafficSource: BusinessTrafficSource.SEARCH, count: 38 },
      { trafficSource: BusinessTrafficSource.CATEGORY, count: 24 },
      { trafficSource: BusinessTrafficSource.MAP, count: 17 },
      { trafficSource: BusinessTrafficSource.HOME, count: 13 },
      { trafficSource: BusinessTrafficSource.PROMOTIONS, count: 8 },
    ]);

    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({ source: 'SEARCH', views: 38, share: 38 });
    const totalShare = result.reduce((sum, row) => sum + row.share, 0);
    expect(totalShare).toBe(100);
  });

  it('maps legacy null trafficSource to UNKNOWN bucket', () => {
    const result = aggregateTrafficSources([
      { trafficSource: null, count: 12 },
      { trafficSource: BusinessTrafficSource.SEARCH, count: 8 },
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'UNKNOWN',
          label: 'Неизвестно',
          views: 12,
          share: 60,
        }),
        expect.objectContaining({
          source: 'SEARCH',
          views: 8,
          share: 40,
        }),
      ]),
    );
  });

  it('returns empty array for zero views', () => {
    expect(aggregateTrafficSources([])).toEqual([]);
  });

  it('includes AD source separately from organic sources', () => {
    const result = aggregateTrafficSources([
      { trafficSource: BusinessTrafficSource.AD, count: 5 },
      { trafficSource: BusinessTrafficSource.HOME, count: 15 },
    ]);

    expect(result.map((row) => row.source)).toEqual(['HOME', 'AD']);
    expect(result.find((row) => row.source === 'AD')?.label).toBe('Реклама');
  });
});
