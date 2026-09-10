-- Stage 6.5.1 — privacy-safe new/returning visitor state

CREATE TYPE "AnalyticsVisitorType" AS ENUM ('NEW', 'RETURNING');

ALTER TABLE "AnalyticsEvent" ADD COLUMN "visitorType" "AnalyticsVisitorType";

CREATE TABLE "AnalyticsBusinessVisitor" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsBusinessVisitor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsBusinessVisitor_businessId_visitorHash_key" ON "AnalyticsBusinessVisitor"("businessId", "visitorHash");
CREATE INDEX "AnalyticsBusinessVisitor_businessId_idx" ON "AnalyticsBusinessVisitor"("businessId");

ALTER TABLE "AnalyticsBusinessVisitor" ADD CONSTRAINT "AnalyticsBusinessVisitor_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
