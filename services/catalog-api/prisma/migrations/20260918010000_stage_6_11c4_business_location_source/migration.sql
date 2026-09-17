-- Stage 6.11C.4: business/application coordinates provenance
CREATE TYPE "BusinessLocationSource" AS ENUM ('GEOCODED', 'MANUALLY_ADJUSTED', 'LEGACY_UNKNOWN');

ALTER TABLE "Business" ADD COLUMN "locationSource" "BusinessLocationSource";

ALTER TABLE "BusinessApplication" ADD COLUMN "latitude" DECIMAL(10,7);
ALTER TABLE "BusinessApplication" ADD COLUMN "longitude" DECIMAL(10,7);
ALTER TABLE "BusinessApplication" ADD COLUMN "locationSource" "BusinessLocationSource";
