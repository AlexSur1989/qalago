-- Stage 6.11C.4 hotfix: QalaGo geocoding search bounds per city
ALTER TABLE "City" ADD COLUMN "geocodingMinLat" DECIMAL(10,7);
ALTER TABLE "City" ADD COLUMN "geocodingMaxLat" DECIMAL(10,7);
ALTER TABLE "City" ADD COLUMN "geocodingMinLng" DECIMAL(10,7);
ALTER TABLE "City" ADD COLUMN "geocodingMaxLng" DECIMAL(10,7);

-- Uralsk (Oral) — urban search box west of center 51.2278, 51.3865 (OSM/WGS84 calibration)
UPDATE "City" SET
  "geocodingMinLat" = 51.05,
  "geocodingMaxLat" = 51.35,
  "geocodingMinLng" = 51.05,
  "geocodingMaxLng" = 51.65
WHERE "slug" = 'uralsk';

-- Aktobe — urban search box around center 50.2839, 57.167
UPDATE "City" SET
  "geocodingMinLat" = 50.12,
  "geocodingMaxLat" = 50.45,
  "geocodingMinLng" = 56.85,
  "geocodingMaxLng" = 57.45
WHERE "slug" = 'aktobe';

-- Shymkent — urban search box around center 42.3417, 69.5901
UPDATE "City" SET
  "geocodingMinLat" = 42.15,
  "geocodingMaxLat" = 42.55,
  "geocodingMinLng" = 69.35,
  "geocodingMaxLng" = 69.85
WHERE "slug" = 'shymkent';
