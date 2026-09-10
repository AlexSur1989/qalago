-- Stage 6.7C: package snapshots, city capacity config, inventory reservations, promotionId on campaigns

CREATE TYPE "AdInventoryReservationStatus" AS ENUM ('HELD', 'CONVERTED', 'EXPIRED', 'CANCELLED');

ALTER TABLE "OrderItem" ADD COLUMN "packageSnapshot" JSONB;
ALTER TABLE "OrderItem" ADD COLUMN "lineSnapshot" JSONB;

ALTER TABLE "AdCampaign" ADD COLUMN "promotionId" TEXT;

CREATE TABLE "AdPlacementCityConfig" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "maxActiveCampaigns" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlacementCityConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdInventoryReservation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "businessId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "categoryId" TEXT,
    "promotionId" TEXT,
    "productId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "AdInventoryReservationStatus" NOT NULL DEFAULT 'HELD',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdInventoryReservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdPlacementCityConfig_placementId_cityId_key" ON "AdPlacementCityConfig"("placementId", "cityId");
CREATE INDEX "AdPlacementCityConfig_cityId_isEnabled_idx" ON "AdPlacementCityConfig"("cityId", "isEnabled");

CREATE INDEX "AdInventoryReservation_orderId_idx" ON "AdInventoryReservation"("orderId");
CREATE INDEX "AdInventoryReservation_orderItemId_idx" ON "AdInventoryReservation"("orderItemId");
CREATE INDEX "AdInventoryReservation_placementId_cityId_status_expiresAt_idx" ON "AdInventoryReservation"("placementId", "cityId", "status", "expiresAt");
CREATE INDEX "AdInventoryReservation_status_expiresAt_idx" ON "AdInventoryReservation"("status", "expiresAt");
CREATE INDEX "AdInventoryReservation_businessId_placementId_status_idx" ON "AdInventoryReservation"("businessId", "placementId", "status");

CREATE INDEX "AdCampaign_promotionId_idx" ON "AdCampaign"("promotionId");

ALTER TABLE "AdPlacementCityConfig" ADD CONSTRAINT "AdPlacementCityConfig_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "AdPlacement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdPlacementCityConfig" ADD CONSTRAINT "AdPlacementCityConfig_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdInventoryReservation" ADD CONSTRAINT "AdInventoryReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdInventoryReservation" ADD CONSTRAINT "AdInventoryReservation_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdInventoryReservation" ADD CONSTRAINT "AdInventoryReservation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdInventoryReservation" ADD CONSTRAINT "AdInventoryReservation_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdInventoryReservation" ADD CONSTRAINT "AdInventoryReservation_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "AdPlacement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdInventoryReservation" ADD CONSTRAINT "AdInventoryReservation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdInventoryReservation" ADD CONSTRAINT "AdInventoryReservation_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdInventoryReservation" ADD CONSTRAINT "AdInventoryReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MonetizationProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Best-effort backfill promotionId from order item metadata for existing promoted campaigns
UPDATE "AdCampaign" c
SET "promotionId" = (oi.metadata->>'promotionId')
FROM "OrderItem" oi
WHERE c."orderItemId" = oi.id
  AND c."promotionId" IS NULL
  AND oi.metadata->>'promotionId' IS NOT NULL;
