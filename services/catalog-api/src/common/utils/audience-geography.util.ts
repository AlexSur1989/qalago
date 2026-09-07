/** Stage 5J — privacy-safe audience geography (coarse distance buckets). */

import { AudienceDistanceBucket } from '@prisma/client';

export const MIN_AUDIENCE_GEOGRAPHY_SAMPLE = 10;

export const AUDIENCE_DISTANCE_BUCKET_ORDER: AudienceDistanceBucket[] = [
  AudienceDistanceBucket.LT_1_KM,
  AudienceDistanceBucket.KM_1_3,
  AudienceDistanceBucket.KM_3_5,
  AudienceDistanceBucket.KM_5_10,
  AudienceDistanceBucket.GT_10_KM,
  AudienceDistanceBucket.UNKNOWN,
];

export const AUDIENCE_DISTANCE_BUCKET_LABELS: Record<AudienceDistanceBucket, string> = {
  [AudienceDistanceBucket.LT_1_KM]: 'До 1 км',
  [AudienceDistanceBucket.KM_1_3]: '1–3 км',
  [AudienceDistanceBucket.KM_3_5]: '3–5 км',
  [AudienceDistanceBucket.KM_5_10]: '5–10 км',
  [AudienceDistanceBucket.GT_10_KM]: 'Более 10 км',
  [AudienceDistanceBucket.UNKNOWN]: 'Не определено',
};

export type AudienceGeographyAggregateRow = {
  bucket: AudienceDistanceBucket | null;
  count: number;
};

export type AudienceGeographyAggregateItem = {
  bucket: AudienceDistanceBucket;
  label: string;
  count: number;
  percentage: number;
};

export type AudienceGeographyAggregateResult = {
  buckets: AudienceGeographyAggregateItem[];
  status: 'AVAILABLE' | 'INSUFFICIENT_DATA';
};

/**
 * Maps distance in km to coarse bucket. Boundaries:
 * LT_1_KM: [0, 1), KM_1_3: [1, 3), KM_3_5: [3, 5), KM_5_10: [5, 10), GT_10_KM: [10, ∞).
 */
export function distanceKmToAudienceBucket(distanceKm: number): AudienceDistanceBucket {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    return AudienceDistanceBucket.UNKNOWN;
  }
  if (distanceKm < 1) return AudienceDistanceBucket.LT_1_KM;
  if (distanceKm < 3) return AudienceDistanceBucket.KM_1_3;
  if (distanceKm < 5) return AudienceDistanceBucket.KM_3_5;
  if (distanceKm < 10) return AudienceDistanceBucket.KM_5_10;
  return AudienceDistanceBucket.GT_10_KM;
}

/**
 * Aggregates VIEW_BUSINESS events by distance bucket.
 * Denominator: all VIEW_BUSINESS in period (includes null → UNKNOWN).
 */
export function aggregateAudienceGeography(
  rows: AudienceGeographyAggregateRow[],
  totalViews: number,
): AudienceGeographyAggregateResult {
  if (totalViews < MIN_AUDIENCE_GEOGRAPHY_SAMPLE) {
    return { buckets: [], status: 'INSUFFICIENT_DATA' };
  }

  const counts = new Map<AudienceDistanceBucket, number>();
  for (const bucket of AUDIENCE_DISTANCE_BUCKET_ORDER) {
    counts.set(bucket, 0);
  }

  for (const row of rows) {
    const bucket = row.bucket ?? AudienceDistanceBucket.UNKNOWN;
    counts.set(bucket, (counts.get(bucket) ?? 0) + row.count);
  }

  const buckets = AUDIENCE_DISTANCE_BUCKET_ORDER.map((bucket) => {
    const count = counts.get(bucket) ?? 0;
    return {
      bucket,
      label: AUDIENCE_DISTANCE_BUCKET_LABELS[bucket],
      count,
      percentage: Math.round((count / totalViews) * 1000) / 10,
    };
  });

  return { buckets, status: 'AVAILABLE' };
}
