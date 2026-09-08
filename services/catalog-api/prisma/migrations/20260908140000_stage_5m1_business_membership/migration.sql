-- Stage 5M.1: Business membership foundation (dual-read with legacy ownerId)

CREATE TYPE "BusinessMembershipRole" AS ENUM ('OWNER', 'MANAGER');

CREATE TYPE "BusinessMembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

CREATE TABLE "BusinessMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "role" "BusinessMembershipRole" NOT NULL,
    "status" "BusinessMembershipStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessMembership_userId_businessId_key" ON "BusinessMembership"("userId", "businessId");

CREATE INDEX "BusinessMembership_userId_idx" ON "BusinessMembership"("userId");

CREATE INDEX "BusinessMembership_businessId_idx" ON "BusinessMembership"("businessId");

CREATE INDEX "BusinessMembership_businessId_status_idx" ON "BusinessMembership"("businessId", "status");

ALTER TABLE "BusinessMembership" ADD CONSTRAINT "BusinessMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessMembership" ADD CONSTRAINT "BusinessMembership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill ACTIVE OWNER memberships from legacy Business.ownerId (idempotent)
INSERT INTO "BusinessMembership" ("id", "userId", "businessId", "role", "status", "createdAt", "updatedAt")
SELECT
    substr(md5(b."id" || ':' || b."ownerId"), 1, 25),
    b."ownerId",
    b."id",
    'OWNER'::"BusinessMembershipRole",
    'ACTIVE'::"BusinessMembershipStatus",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Business" b
WHERE b."ownerId" IS NOT NULL
ON CONFLICT ("userId", "businessId") DO NOTHING;
