-- CW.3A — enforce global + city uniqueness (PostgreSQL NULL != NULL in plain UNIQUE)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "HomeSectionConfig"
    WHERE "cityId" IS NULL
    GROUP BY "sectionType"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'CW.3A migration blocked: duplicate global HomeSectionConfig rows for same sectionType';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "HomeSectionConfig"
    WHERE "cityId" IS NOT NULL
    GROUP BY "cityId", "sectionType"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'CW.3A migration blocked: duplicate city HomeSectionConfig rows for same (cityId, sectionType)';
  END IF;
END $$;

DROP INDEX IF EXISTS "HomeSectionConfig_cityId_sectionType_key";

CREATE UNIQUE INDEX "HomeSectionConfig_global_sectionType_key"
  ON "HomeSectionConfig" ("sectionType")
  WHERE "cityId" IS NULL;

CREATE UNIQUE INDEX "HomeSectionConfig_city_sectionType_key"
  ON "HomeSectionConfig" ("cityId", "sectionType")
  WHERE "cityId" IS NOT NULL;
