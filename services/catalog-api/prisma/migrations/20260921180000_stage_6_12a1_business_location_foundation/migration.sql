-- Stage 6.12A.1: BusinessLocation additive foundation (no Business backfill).

CREATE TABLE "BusinessLocation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "location" geography(Point, 4326),
    "locationSource" "BusinessLocationSource",
    "workHours" JSONB,
    "phone" TEXT,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "website" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessLocation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessLocation_businessId_idx" ON "BusinessLocation"("businessId");
CREATE INDEX "BusinessLocation_cityId_idx" ON "BusinessLocation"("cityId");
CREATE INDEX "BusinessLocation_businessId_cityId_idx" ON "BusinessLocation"("businessId", "cityId");

CREATE UNIQUE INDEX "BusinessLocation_businessId_isPrimary_key"
  ON "BusinessLocation"("businessId")
  WHERE "isPrimary" = true;

CREATE INDEX "BusinessLocation_location_gist_idx"
  ON "BusinessLocation" USING GIST ("location")
  WHERE "location" IS NOT NULL;

ALTER TABLE "BusinessLocation" ADD CONSTRAINT "BusinessLocation_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessLocation" ADD CONSTRAINT "BusinessLocation_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION public.business_location_derive_location_from_coordinates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."latitude" IS NULL OR NEW."longitude" IS NULL THEN
    NEW."location" := NULL;
    RETURN NEW;
  END IF;

  IF NEW."latitude" = 0 AND NEW."longitude" = 0 THEN
    NEW."location" := NULL;
    RETURN NEW;
  END IF;

  IF NEW."latitude" < -90 OR NEW."latitude" > 90
     OR NEW."longitude" < -180 OR NEW."longitude" > 180 THEN
    NEW."location" := NULL;
    RETURN NEW;
  END IF;

  NEW."location" := ST_SetSRID(
    ST_MakePoint(
      NEW."longitude"::double precision,
      NEW."latitude"::double precision
    ),
    4326
  )::geography;

  RETURN NEW;
END;
$$;

CREATE TRIGGER business_location_sync_location_trigger
  BEFORE INSERT OR UPDATE OF "latitude", "longitude"
  ON "BusinessLocation"
  FOR EACH ROW
  EXECUTE FUNCTION public.business_location_derive_location_from_coordinates();
