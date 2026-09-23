-- Stage 6.12A.8.1 — FK semantics fix
-- AdCampaign: composite same-business FK with RESTRICT (SET NULL incompatible with required businessId).
-- AnalyticsEvent: single-column FK with SET NULL (preserve historical events on branch delete).

-- DropForeignKey
ALTER TABLE "AdCampaign" DROP CONSTRAINT "AdCampaign_businessId_destinationBusinessLocationId_fkey";

-- DropForeignKey
ALTER TABLE "AdCampaign" DROP CONSTRAINT "AdCampaign_businessId_targetBusinessLocationId_fkey";

-- DropForeignKey
ALTER TABLE "AnalyticsEvent" DROP CONSTRAINT "AnalyticsEvent_businessId_businessLocationId_fkey";

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_businessLocationId_fkey" FOREIGN KEY ("businessLocationId") REFERENCES "BusinessLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_businessId_targetBusinessLocationId_fkey" FOREIGN KEY ("businessId", "targetBusinessLocationId") REFERENCES "BusinessLocation"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_businessId_destinationBusinessLocationId_fkey" FOREIGN KEY ("businessId", "destinationBusinessLocationId") REFERENCES "BusinessLocation"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
