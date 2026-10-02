-- WEB-HOME.2 — global HOME_POPULAR default row (position 60)

INSERT INTO "HomeSectionConfig" ("id", "sectionType", "platform", "enabled", "position", "cityId", "updatedAt")
SELECT 'cw3-home-popular-global', 'HOME_POPULAR', 'ALL', true, 60, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "HomeSectionConfig" WHERE "sectionType" = 'HOME_POPULAR' AND "cityId" IS NULL
);
