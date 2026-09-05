-- Stage 5C: organic website/instagram click analytics
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'WEBSITE_CLICK';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'INSTAGRAM_CLICK';
