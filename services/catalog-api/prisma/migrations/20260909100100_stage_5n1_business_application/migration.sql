-- Stage 5N.1: BusinessApplication model for safe new-business registration

CREATE TYPE "BusinessApplicationStatus" AS ENUM (
  'DRAFT',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

CREATE TABLE "BusinessApplication" (
  "id" TEXT NOT NULL,
  "applicantUserId" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortDesc" TEXT,
  "address" TEXT NOT NULL,
  "phone" TEXT,
  "status" "BusinessApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "dedupeKey" TEXT NOT NULL,
  "rejectionReason" TEXT,
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "approvedBusinessId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BusinessApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessApplication_approvedBusinessId_key" ON "BusinessApplication"("approvedBusinessId");

CREATE INDEX "BusinessApplication_applicantUserId_idx" ON "BusinessApplication"("applicantUserId");
CREATE INDEX "BusinessApplication_status_idx" ON "BusinessApplication"("status");
CREATE INDEX "BusinessApplication_cityId_idx" ON "BusinessApplication"("cityId");
CREATE INDEX "BusinessApplication_createdAt_idx" ON "BusinessApplication"("createdAt");
CREATE INDEX "BusinessApplication_cityId_status_createdAt_idx" ON "BusinessApplication"("cityId", "status", "createdAt");
CREATE INDEX "BusinessApplication_dedupeKey_idx" ON "BusinessApplication"("dedupeKey");

-- Prevent duplicate active drafts/pending for same applicant + dedupe identity
CREATE UNIQUE INDEX "BusinessApplication_applicant_dedupe_active_key"
  ON "BusinessApplication"("applicantUserId", "dedupeKey")
  WHERE "status" IN ('DRAFT', 'PENDING');

ALTER TABLE "BusinessApplication"
  ADD CONSTRAINT "BusinessApplication_applicantUserId_fkey"
  FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessApplication"
  ADD CONSTRAINT "BusinessApplication_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BusinessApplication"
  ADD CONSTRAINT "BusinessApplication_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BusinessApplication"
  ADD CONSTRAINT "BusinessApplication_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BusinessApplication"
  ADD CONSTRAINT "BusinessApplication_approvedBusinessId_fkey"
  FOREIGN KEY ("approvedBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
