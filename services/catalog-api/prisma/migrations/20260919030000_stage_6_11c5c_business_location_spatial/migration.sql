-- Stage 6.11C.5C: Business.location geography + sync trigger + backfill + GiST (no query migration).

ALTER TABLE "Business" ADD COLUMN "location" geography(Point, 4326);

CREATE OR REPLACE FUNCTION public.business_derive_location_from_coordinates()
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

DROP TRIGGER IF EXISTS business_sync_location_trigger ON "Business";

CREATE TRIGGER business_sync_location_trigger
  BEFORE INSERT OR UPDATE OF "latitude", "longitude"
  ON "Business"
  FOR EACH ROW
  EXECUTE FUNCTION public.business_derive_location_from_coordinates();

-- Backfill derived location without mutating latitude/longitude (fires trigger).
UPDATE "Business"
SET "longitude" = "longitude";

-- Partial GiST: only indexed rows participate in spatial lookups (nullable column).
CREATE INDEX "Business_location_gist_idx"
  ON "Business" USING GIST ("location")
  WHERE "location" IS NOT NULL;
