-- Stage 6.12A.2: Idempotent 1:1 primary BusinessLocation backfill from existing Business rows.
-- Does NOT modify Business physical fields. Geography derived via BusinessLocation trigger.

INSERT INTO "BusinessLocation" (
  "id",
  "businessId",
  "cityId",
  "address",
  "latitude",
  "longitude",
  "locationSource",
  "workHours",
  "phone",
  "whatsapp",
  "instagram",
  "website",
  "isPrimary",
  "createdAt",
  "updatedAt"
)
SELECT
  'bl' || substr(md5(b."id" || ':6.12A.2-primary'), 1, 22),
  b."id",
  b."cityId",
  b."address",
  b."latitude",
  b."longitude",
  b."locationSource",
  b."workHours",
  b."phone",
  b."whatsapp",
  b."instagram",
  b."website",
  true,
  b."createdAt",
  CURRENT_TIMESTAMP
FROM "Business" b
WHERE NOT EXISTS (
  SELECT 1 FROM "BusinessLocation" bl WHERE bl."businessId" = b."id"
);
