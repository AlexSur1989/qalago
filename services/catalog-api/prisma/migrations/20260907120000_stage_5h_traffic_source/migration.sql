-- Stage 5H: explicit business traffic source attribution on VIEW_BUSINESS events.

CREATE TYPE "BusinessTrafficSource" AS ENUM (
  'HOME',
  'SEARCH',
  'CATEGORY',
  'MAP',
  'PROMOTIONS',
  'FAVORITES',
  'AD',
  'DIRECT',
  'UNKNOWN'
);

ALTER TABLE "AnalyticsEvent" ADD COLUMN "trafficSource" "BusinessTrafficSource";

CREATE INDEX "AnalyticsEvent_businessId_type_trafficSource_idx"
  ON "AnalyticsEvent"("businessId", "type", "trafficSource");
