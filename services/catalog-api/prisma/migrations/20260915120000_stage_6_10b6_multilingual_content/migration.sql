-- Stage 6.10B.6 — multilingual content model (additive, non-destructive)

ALTER TABLE "City" ADD COLUMN IF NOT EXISTS "nameKk" TEXT;

UPDATE "City"
SET "nameKk" = 'Орал'
WHERE "slug" = 'uralsk'
  AND ("nameKk" IS NULL OR btrim("nameKk") = '');

UPDATE "City"
SET "nameKk" = 'Ақтөбе'
WHERE "slug" = 'aktobe'
  AND ("nameKk" IS NULL OR btrim("nameKk") = '');

ALTER TABLE "ServiceItem" ADD COLUMN IF NOT EXISTS "titleKk" TEXT;
ALTER TABLE "ServiceItem" ADD COLUMN IF NOT EXISTS "descriptionKk" TEXT;

ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "titleKk" TEXT;
ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "descriptionKk" TEXT;
