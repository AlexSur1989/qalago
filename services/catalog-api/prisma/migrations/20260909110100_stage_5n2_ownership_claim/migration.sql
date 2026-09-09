-- Stage 5N.2: BusinessOwnershipClaim for existing-business ownership moderation

CREATE TYPE "BusinessOwnershipClaimStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

CREATE TYPE "BusinessOwnershipClaimVerificationMethod" AS ENUM (
  'MANUAL'
);

CREATE TABLE "BusinessOwnershipClaim" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "claimantUserId" TEXT NOT NULL,
  "status" "BusinessOwnershipClaimStatus" NOT NULL DEFAULT 'PENDING',
  "verificationMethod" "BusinessOwnershipClaimVerificationMethod" NOT NULL DEFAULT 'MANUAL',
  "claimantMessage" TEXT,
  "rejectionReason" TEXT,
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BusinessOwnershipClaim_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessOwnershipClaim_claimantUserId_idx" ON "BusinessOwnershipClaim"("claimantUserId");
CREATE INDEX "BusinessOwnershipClaim_businessId_idx" ON "BusinessOwnershipClaim"("businessId");
CREATE INDEX "BusinessOwnershipClaim_status_idx" ON "BusinessOwnershipClaim"("status");
CREATE INDEX "BusinessOwnershipClaim_createdAt_idx" ON "BusinessOwnershipClaim"("createdAt");
CREATE INDEX "BusinessOwnershipClaim_businessId_status_createdAt_idx" ON "BusinessOwnershipClaim"("businessId", "status", "createdAt");
CREATE INDEX "BusinessOwnershipClaim_claimantUserId_status_createdAt_idx" ON "BusinessOwnershipClaim"("claimantUserId", "status", "createdAt");

-- At most one PENDING claim per business + claimant
CREATE UNIQUE INDEX "BusinessOwnershipClaim_business_claimant_pending_key"
  ON "BusinessOwnershipClaim"("businessId", "claimantUserId")
  WHERE "status" = 'PENDING';

ALTER TABLE "BusinessOwnershipClaim"
  ADD CONSTRAINT "BusinessOwnershipClaim_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessOwnershipClaim"
  ADD CONSTRAINT "BusinessOwnershipClaim_claimantUserId_fkey"
  FOREIGN KEY ("claimantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessOwnershipClaim"
  ADD CONSTRAINT "BusinessOwnershipClaim_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
