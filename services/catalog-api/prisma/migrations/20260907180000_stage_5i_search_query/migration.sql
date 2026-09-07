-- Stage 5I: normalized search query on VIEW_BUSINESS events (SEARCH attribution only).

ALTER TABLE "AnalyticsEvent" ADD COLUMN "searchQuery" TEXT;

CREATE INDEX "AnalyticsEvent_businessId_type_createdAt_idx"
  ON "AnalyticsEvent"("businessId", "type", "createdAt");
