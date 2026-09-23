-- Stage 6.12A.8.1 — nullable BusinessLocation context for AdCampaign + AnalyticsEvent

-- AlterTable
ALTER TABLE "AdCampaign" ADD COLUMN     "destinationBusinessLocationId" TEXT,
ADD COLUMN     "targetBusinessLocationId" TEXT;

-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN     "businessLocationId" TEXT;

-- CreateIndex
CREATE INDEX "AdCampaign_targetBusinessLocationId_idx" ON "AdCampaign"("targetBusinessLocationId");

-- CreateIndex
CREATE INDEX "AdCampaign_destinationBusinessLocationId_idx" ON "AdCampaign"("destinationBusinessLocationId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_campaignId_businessLocationId_idx" ON "AnalyticsEvent"("campaignId", "businessLocationId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_businessLocationId_type_createdAt_idx" ON "AnalyticsEvent"("businessLocationId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_businessId_businessLocationId_fkey" FOREIGN KEY ("businessId", "businessLocationId") REFERENCES "BusinessLocation"("businessId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_businessId_targetBusinessLocationId_fkey" FOREIGN KEY ("businessId", "targetBusinessLocationId") REFERENCES "BusinessLocation"("businessId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_businessId_destinationBusinessLocationId_fkey" FOREIGN KEY ("businessId", "destinationBusinessLocationId") REFERENCES "BusinessLocation"("businessId", "id") ON DELETE SET NULL ON UPDATE CASCADE;
