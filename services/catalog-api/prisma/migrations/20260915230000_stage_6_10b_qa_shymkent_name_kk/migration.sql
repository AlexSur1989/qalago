-- Stage 6.10B.QA — Shymkent official KK display name (same spelling as RU)

UPDATE "City"
SET "nameKk" = 'Шымкент'
WHERE "slug" = 'shymkent'
  AND ("nameKk" IS NULL OR btrim("nameKk") = '');
