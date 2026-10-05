-- Apply with old API instances stopped. Historical staff session assurance is unknown.
ALTER TABLE "AuthSession" ADD COLUMN "mfaEnrollOnly" BOOLEAN NOT NULL DEFAULT false;

UPDATE "AuthSession" AS s
SET "revokedAt" = CURRENT_TIMESTAMP
FROM "User" AS u
WHERE s."userId" = u."id"
  AND s."revokedAt" IS NULL
  AND (u."role"::text NOT IN ('USER', 'BUSINESS')
       OR EXISTS (SELECT 1 FROM "StaffAccess" AS a WHERE a."userId" = u."id"));
