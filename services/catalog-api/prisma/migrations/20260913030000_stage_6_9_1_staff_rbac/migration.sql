-- Stage 6.9.1 — Staff RBAC foundation (additive)

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MODERATOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SALES_MANAGER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CONTENT_MANAGER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FINANCE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPPORT';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ANALYST';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TECH_ADMIN';

CREATE TABLE "StaffAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffRole" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "disabledAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "mfaEnrolledAt" TIMESTAMP(3),
    "mfaRequired" BOOLEAN NOT NULL DEFAULT false,
    "lastStaffLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffCityScope" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "StaffCityScope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffAccess_userId_key" ON "StaffAccess"("userId");
CREATE INDEX "StaffAccess_staffRole_isActive_idx" ON "StaffAccess"("staffRole", "isActive");
CREATE UNIQUE INDEX "StaffCityScope_userId_cityId_key" ON "StaffCityScope"("userId", "cityId");
CREATE INDEX "StaffCityScope_cityId_idx" ON "StaffCityScope"("cityId");

ALTER TABLE "StaffAccess" ADD CONSTRAINT "StaffAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffAccess" ADD CONSTRAINT "StaffAccess_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StaffCityScope" ADD CONSTRAINT "StaffCityScope_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffCityScope" ADD CONSTRAINT "StaffCityScope_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill staff rows for existing platform staff (idempotent)
INSERT INTO "StaffAccess" ("id", "userId", "staffRole", "isActive", "createdAt", "updatedAt")
SELECT
  'staff_' || u."id",
  u."id",
  u."role",
  u."isActive",
  NOW(),
  NOW()
FROM "User" u
WHERE u."role" IN ('SUPER_ADMIN', 'ADMIN', 'CITY_ADMIN')
  AND NOT EXISTS (SELECT 1 FROM "StaffAccess" sa WHERE sa."userId" = u."id");

INSERT INTO "StaffCityScope" ("id", "userId", "cityId")
SELECT
  'staffcity_' || u."id" || '_' || u."managedCityId",
  u."id",
  u."managedCityId"
FROM "User" u
WHERE u."role" = 'CITY_ADMIN'
  AND u."managedCityId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "StaffCityScope" sc
    WHERE sc."userId" = u."id" AND sc."cityId" = u."managedCityId"
  );

-- AuditAction / AuditResourceType extensions
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STAFF_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STAFF_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STAFF_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STAFF_ROLE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STAFF_CITY_SCOPE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STAFF_SESSION_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STAFF_BOOTSTRAP';

ALTER TYPE "AuditResourceType" ADD VALUE IF NOT EXISTS 'STAFF_ACCESS';
ALTER TYPE "AuditResourceType" ADD VALUE IF NOT EXISTS 'AUTH_SESSION';
