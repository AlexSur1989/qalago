-- Stage 6.12A.7.7.1 — optional BusinessLocation scope on BusinessImage (shared vs branch media).

-- AlterTable
ALTER TABLE "BusinessImage" ADD COLUMN "locationId" TEXT;

-- CreateIndex
CREATE INDEX "BusinessImage_businessId_locationId_sortOrder_idx" ON "BusinessImage"("businessId", "locationId", "sortOrder");

-- CreateIndex
CREATE INDEX "BusinessImage_businessId_locationId_moderationHidden_idx" ON "BusinessImage"("businessId", "locationId", "moderationHidden");

-- Composite unique enables same-business composite FK (businessId, id) on BusinessLocation.
CREATE UNIQUE INDEX "BusinessLocation_businessId_id_key" ON "BusinessLocation"("businessId", "id");

-- Branch-scoped images: RESTRICT location delete while referenced (no silent SET NULL → brand promotion).
ALTER TABLE "BusinessImage" ADD CONSTRAINT "BusinessImage_businessId_locationId_fkey" FOREIGN KEY ("businessId", "locationId") REFERENCES "BusinessLocation"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
