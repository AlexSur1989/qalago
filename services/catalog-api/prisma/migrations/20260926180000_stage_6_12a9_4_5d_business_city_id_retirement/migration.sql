-- Stage 6.12A.9.4.5D — retire Business.cityId parent-city compatibility mirror.
-- BusinessLocation.cityId remains physical city authority.
-- DO NOT apply until 5D2 backup gate.

ALTER TABLE "Business" DROP CONSTRAINT "Business_cityId_fkey";

DROP INDEX IF EXISTS "Business_cityId_status_idx";

ALTER TABLE "Business" DROP COLUMN "cityId";
