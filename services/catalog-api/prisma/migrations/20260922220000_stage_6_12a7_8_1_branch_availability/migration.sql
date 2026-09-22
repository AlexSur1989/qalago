-- Stage 6.12A.7.8.1 — ServiceItem / Promotion branch availability (M2M assignment tables).
-- Semantics: zero assignment rows = all branches; >=1 = only assigned branches.
-- BusinessLocation delete: RESTRICT while assignments reference the branch (avoids silent broadening).

-- CreateTable
CREATE TABLE "ServiceItemBranchAvailability" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "serviceItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceItemBranchAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionBranchAvailability" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionBranchAvailability_pkey" PRIMARY KEY ("id")
);

-- Composite uniques for same-business composite FK targets.
CREATE UNIQUE INDEX "ServiceItem_businessId_id_key" ON "ServiceItem"("businessId", "id");

CREATE UNIQUE INDEX "Promotion_businessId_id_key" ON "Promotion"("businessId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceItemBranchAvailability_serviceItemId_locationId_key" ON "ServiceItemBranchAvailability"("serviceItemId", "locationId");

CREATE UNIQUE INDEX "PromotionBranchAvailability_promotionId_locationId_key" ON "PromotionBranchAvailability"("promotionId", "locationId");

CREATE INDEX "ServiceItemBranchAvailability_businessId_idx" ON "ServiceItemBranchAvailability"("businessId");

CREATE INDEX "ServiceItemBranchAvailability_businessId_serviceItemId_idx" ON "ServiceItemBranchAvailability"("businessId", "serviceItemId");

CREATE INDEX "PromotionBranchAvailability_businessId_idx" ON "PromotionBranchAvailability"("businessId");

CREATE INDEX "PromotionBranchAvailability_businessId_promotionId_idx" ON "PromotionBranchAvailability"("businessId", "promotionId");

-- AddForeignKey
ALTER TABLE "ServiceItemBranchAvailability" ADD CONSTRAINT "ServiceItemBranchAvailability_businessId_serviceItemId_fkey" FOREIGN KEY ("businessId", "serviceItemId") REFERENCES "ServiceItem"("businessId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceItemBranchAvailability" ADD CONSTRAINT "ServiceItemBranchAvailability_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "BusinessLocation"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PromotionBranchAvailability" ADD CONSTRAINT "PromotionBranchAvailability_businessId_promotionId_fkey" FOREIGN KEY ("businessId", "promotionId") REFERENCES "Promotion"("businessId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PromotionBranchAvailability" ADD CONSTRAINT "PromotionBranchAvailability_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "BusinessLocation"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
