-- Stage 5M.2: Business permissions + invitations

CREATE TYPE "BusinessPermission" AS ENUM (
  'BUSINESS_PROFILE_EDIT',
  'BUSINESS_HOURS_EDIT',
  'CATALOG_EDIT',
  'PHOTOS_EDIT',
  'PROMOTIONS_EDIT',
  'REVIEWS_REPLY',
  'ANALYTICS_VIEW',
  'ANALYTICS_EXPORT',
  'ADS_MANAGE',
  'PAYMENTS_VIEW'
);

CREATE TYPE "BusinessInvitationStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REVOKED',
  'EXPIRED'
);

ALTER TABLE "BusinessMembership" ADD COLUMN "permissions" "BusinessPermission"[] NOT NULL DEFAULT ARRAY[]::"BusinessPermission"[];

CREATE TABLE "BusinessInvitation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "permissions" "BusinessPermission"[],
    "status" "BusinessInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessInvitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessInvitation_businessId_phone_idx" ON "BusinessInvitation"("businessId", "phone");
CREATE INDEX "BusinessInvitation_phone_status_idx" ON "BusinessInvitation"("phone", "status");

ALTER TABLE "BusinessInvitation" ADD CONSTRAINT "BusinessInvitation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessInvitation" ADD CONSTRAINT "BusinessInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
