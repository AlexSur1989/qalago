-- Stage 6.12A.9.4.4C4: Retire legacy Business physical geo storage (authority = BusinessLocation).
-- Business.cityId and contact defaults remain until A.9.4.5.

DROP TRIGGER IF EXISTS business_sync_location_trigger ON public."Business";

DROP INDEX IF EXISTS public."Business_location_gist_idx";

ALTER TABLE public."Business"
  DROP COLUMN IF EXISTS "location",
  DROP COLUMN IF EXISTS "longitude",
  DROP COLUMN IF EXISTS "latitude",
  DROP COLUMN IF EXISTS "locationSource",
  DROP COLUMN IF EXISTS "address";

DROP FUNCTION IF EXISTS public.business_derive_location_from_coordinates();
