-- Stage 6.8C: runtime release config + feature flags
CREATE TABLE "AppReleaseSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "maintenanceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessageRu" TEXT,
    "maintenanceMessageKk" TEXT,
    "maintenanceEndsAt" TIMESTAMP(3),
    "androidMinimumVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "androidLatestVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "androidMinimumBuild" INTEGER,
    "androidLatestBuild" INTEGER,
    "androidStoreUrl" TEXT,
    "iosMinimumVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "iosLatestVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "iosMinimumBuild" INTEGER,
    "iosLatestBuild" INTEGER,
    "iosStoreUrl" TEXT,
    "configRevision" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "AppReleaseSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeatureFlagDefinition" (
    "key" TEXT NOT NULL,
    "globalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "androidEnabled" BOOLEAN,
    "iosEnabled" BOOLEAN,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlagDefinition_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "CityFeatureFlagOverride" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "CityFeatureFlagOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CityFeatureFlagOverride_cityId_flagKey_key" ON "CityFeatureFlagOverride"("cityId", "flagKey");
CREATE INDEX "CityFeatureFlagOverride_flagKey_idx" ON "CityFeatureFlagOverride"("flagKey");

ALTER TABLE "CityFeatureFlagOverride" ADD CONSTRAINT "CityFeatureFlagOverride_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "AuditAction" ADD VALUE 'RELEASE_CONFIG_UPDATE';
ALTER TYPE "AuditResourceType" ADD VALUE 'APP_RELEASE_CONFIG';
