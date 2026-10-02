-- CW.3 — backend-controlled home section configuration

CREATE TYPE "HomeSectionType" AS ENUM (
  'HOME_VIP_BANNER',
  'CATEGORIES',
  'HOME_FEATURED',
  'HOME_PROMOTIONS',
  'NEARBY'
);

CREATE TYPE "HomeSectionPlatform" AS ENUM ('APP', 'WEB', 'ALL');

CREATE TABLE "HomeSectionConfig" (
  "id" TEXT NOT NULL,
  "sectionType" "HomeSectionType" NOT NULL,
  "platform" "HomeSectionPlatform" NOT NULL DEFAULT 'ALL',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "position" INTEGER NOT NULL,
  "cityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomeSectionConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomeSectionConfig_cityId_sectionType_key" ON "HomeSectionConfig"("cityId", "sectionType");
CREATE INDEX "HomeSectionConfig_cityId_position_idx" ON "HomeSectionConfig"("cityId", "position");

ALTER TABLE "HomeSectionConfig"
  ADD CONSTRAINT "HomeSectionConfig_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Global defaults (deterministic bootstrap; city rows override per sectionType)
INSERT INTO "HomeSectionConfig" ("id", "sectionType", "platform", "enabled", "position", "cityId", "updatedAt")
VALUES
  ('cw3-home-vip-global', 'HOME_VIP_BANNER', 'ALL', true, 10, NULL, CURRENT_TIMESTAMP),
  ('cw3-categories-global', 'CATEGORIES', 'ALL', true, 20, NULL, CURRENT_TIMESTAMP),
  ('cw3-featured-global', 'HOME_FEATURED', 'ALL', true, 30, NULL, CURRENT_TIMESTAMP),
  ('cw3-promotions-global', 'HOME_PROMOTIONS', 'ALL', true, 40, NULL, CURRENT_TIMESTAMP),
  ('cw3-nearby-global', 'NEARBY', 'ALL', true, 50, NULL, CURRENT_TIMESTAMP);
