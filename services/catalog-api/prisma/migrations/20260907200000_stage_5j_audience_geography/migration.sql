-- Stage 5J: privacy-safe audience geography (coarse distance buckets only)

CREATE TYPE "AudienceDistanceBucket" AS ENUM (
  'LT_1_KM',
  'KM_1_3',
  'KM_3_5',
  'KM_5_10',
  'GT_10_KM',
  'UNKNOWN'
);

ALTER TABLE "AnalyticsEvent"
  ADD COLUMN "audienceDistanceBucket" "AudienceDistanceBucket";

CREATE INDEX "AnalyticsEvent_businessId_type_audienceDistanceBucket_idx"
  ON "AnalyticsEvent"("businessId", "type", "audienceDistanceBucket");
