import { AudienceDistanceBucket } from '@prisma/client';
import { distanceKmToAudienceBucket } from './audience-geography.util';

describe('distanceKmToAudienceBucket', () => {
  it('maps boundary values correctly', () => {
    expect(distanceKmToAudienceBucket(0)).toBe(AudienceDistanceBucket.LT_1_KM);
    expect(distanceKmToAudienceBucket(0.999)).toBe(AudienceDistanceBucket.LT_1_KM);
    expect(distanceKmToAudienceBucket(1.0)).toBe(AudienceDistanceBucket.KM_1_3);
    expect(distanceKmToAudienceBucket(2.999)).toBe(AudienceDistanceBucket.KM_1_3);
    expect(distanceKmToAudienceBucket(3.0)).toBe(AudienceDistanceBucket.KM_3_5);
    expect(distanceKmToAudienceBucket(4.999)).toBe(AudienceDistanceBucket.KM_3_5);
    expect(distanceKmToAudienceBucket(5.0)).toBe(AudienceDistanceBucket.KM_5_10);
    expect(distanceKmToAudienceBucket(9.999)).toBe(AudienceDistanceBucket.KM_5_10);
    expect(distanceKmToAudienceBucket(10.0)).toBe(AudienceDistanceBucket.GT_10_KM);
    expect(distanceKmToAudienceBucket(100)).toBe(AudienceDistanceBucket.GT_10_KM);
  });

  it('returns UNKNOWN for invalid input', () => {
    expect(distanceKmToAudienceBucket(Number.NaN)).toBe(AudienceDistanceBucket.UNKNOWN);
    expect(distanceKmToAudienceBucket(-1)).toBe(AudienceDistanceBucket.UNKNOWN);
  });
});
