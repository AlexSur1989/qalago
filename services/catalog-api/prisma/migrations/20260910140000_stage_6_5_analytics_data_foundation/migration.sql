-- Stage 6.5 — Analytics data foundation (idempotent where possible)

DO $$ BEGIN
  CREATE TYPE "AnalyticsDiscoverySurface" AS ENUM ('HOME_FEED', 'HOME_RECOMMENDED', 'SEARCH_RESULTS', 'CATEGORY_LIST', 'MAP_PIN', 'NEARBY_LIST', 'FAVORITES_LIST', 'PROMOTION_LIST', 'PROMOTION_DETAIL', 'BUSINESS_DETAIL', 'DIRECT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnalyticsPlatform" AS ENUM ('IOS', 'ANDROID', 'WEB', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnalyticsDimensionType" AS ENUM ('SOURCE', 'SEARCH_QUERY', 'PROMOTION', 'CATALOG_ITEM', 'HOUR', 'DISTANCE_BUCKET', 'VISITOR_TYPE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'BUSINESS_IMPRESSION';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'SEARCH_PERFORMED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'SEARCH_RESULT_IMPRESSION';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'SEARCH_RESULT_OPEN';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'PROMOTION_IMPRESSION';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'PROMOTION_ACTION';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'CATALOG_ITEM_IMPRESSION';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'CATALOG_ITEM_VIEW';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'CATALOG_ITEM_ACTION';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'REVIEWS_VIEW';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'REVIEW_CREATED';

ALTER TABLE "AnalyticsEvent" ALTER COLUMN "businessId" DROP NOT NULL;

ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "cityId" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "discoverySurface" "AnalyticsDiscoverySurface";
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "promotionId" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "catalogItemId" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "position" INTEGER;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "platform" "AnalyticsPlatform";
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "visitorHash" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "clientEventId" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "isInternal" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "AnalyticsDailyMetric" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "metricDate" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "callClicks" INTEGER NOT NULL DEFAULT 0,
    "whatsappClicks" INTEGER NOT NULL DEFAULT 0,
    "routeClicks" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "instagramClicks" INTEGER NOT NULL DEFAULT 0,
    "favoriteAdds" INTEGER NOT NULL DEFAULT 0,
    "promotionImpressions" INTEGER NOT NULL DEFAULT 0,
    "promotionViews" INTEGER NOT NULL DEFAULT 0,
    "promotionActions" INTEGER NOT NULL DEFAULT 0,
    "catalogImpressions" INTEGER NOT NULL DEFAULT 0,
    "catalogViews" INTEGER NOT NULL DEFAULT 0,
    "catalogActions" INTEGER NOT NULL DEFAULT 0,
    "reviewsViews" INTEGER NOT NULL DEFAULT 0,
    "reviewsCreated" INTEGER NOT NULL DEFAULT 0,
    "searchImpressions" INTEGER NOT NULL DEFAULT 0,
    "searchOpens" INTEGER NOT NULL DEFAULT 0,
    "sessionsApprox" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitorsApprox" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsDailyMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AnalyticsDailyDimensionMetric" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "metricDate" TEXT NOT NULL,
    "dimensionType" "AnalyticsDimensionType" NOT NULL,
    "dimensionKey" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsDailyDimensionMetric_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsEvent_clientEventId_key" ON "AnalyticsEvent"("clientEventId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_businessId_createdAt_idx" ON "AnalyticsEvent"("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_cityId_createdAt_idx" ON "AnalyticsEvent"("cityId", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_promotionId_idx" ON "AnalyticsEvent"("promotionId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_catalogItemId_idx" ON "AnalyticsEvent"("catalogItemId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_visitorHash_idx" ON "AnalyticsEvent"("visitorHash");
CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsDailyMetric_businessId_metricDate_key" ON "AnalyticsDailyMetric"("businessId", "metricDate");
CREATE INDEX IF NOT EXISTS "AnalyticsDailyMetric_businessId_metricDate_idx" ON "AnalyticsDailyMetric"("businessId", "metricDate");
CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsDailyDimensionMetric_businessId_metricDate_dimensionType_dimensionKey_metricKey_key" ON "AnalyticsDailyDimensionMetric"("businessId", "metricDate", "dimensionType", "dimensionKey", "metricKey");
CREATE INDEX IF NOT EXISTS "AnalyticsDailyDimensionMetric_businessId_metricDate_dimensionType_idx" ON "AnalyticsDailyDimensionMetric"("businessId", "metricDate", "dimensionType");

DO $$ BEGIN
  ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "ServiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AnalyticsDailyMetric" ADD CONSTRAINT "AnalyticsDailyMetric_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AnalyticsDailyDimensionMetric" ADD CONSTRAINT "AnalyticsDailyDimensionMetric_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
