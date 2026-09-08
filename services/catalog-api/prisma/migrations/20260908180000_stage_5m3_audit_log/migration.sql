-- Stage 5M.3 — centralized security audit log (append-only)

CREATE TYPE "AuditAction" AS ENUM (
  'TEAM_INVITE',
  'TEAM_INVITATION_ACCEPT',
  'TEAM_PERMISSION_UPDATE',
  'TEAM_SUSPEND',
  'TEAM_RESTORE',
  'TEAM_REVOKE',
  'BUSINESS_PROFILE_UPDATE',
  'BUSINESS_HOURS_UPDATE',
  'CATALOG_ITEM_CREATE',
  'CATALOG_ITEM_UPDATE',
  'CATALOG_ITEM_DELETE',
  'CATALOG_SECTION_CREATE',
  'CATALOG_SECTION_UPDATE',
  'CATALOG_SECTION_DELETE',
  'BUSINESS_PHOTO_ADD',
  'BUSINESS_PHOTO_DELETE',
  'BUSINESS_COVER_CHANGE',
  'PROMOTION_CREATE',
  'PROMOTION_UPDATE',
  'PROMOTION_DELETE',
  'REVIEW_REPLY_CREATE',
  'PLAN_CHECKOUT',
  'PLAN_OVERRIDE',
  'AD_ORDER_CREATE',
  'AD_CREATIVE_CREATE',
  'AD_CREATIVE_APPROVE',
  'AD_CREATIVE_REJECT',
  'AD_CAMPAIGN_PAUSE',
  'AD_CAMPAIGN_ACTIVATE',
  'PAYMENT_CONFIRM',
  'USER_ROLE_CHANGE',
  'CITY_CREATE',
  'CITY_UPDATE',
  'CITY_LAUNCH_STATUS_CHANGE',
  'CATEGORY_CREATE',
  'CATEGORY_UPDATE',
  'CATEGORY_DELETE'
);

CREATE TYPE "AuditResourceType" AS ENUM (
  'USER',
  'BUSINESS',
  'BUSINESS_MEMBERSHIP',
  'BUSINESS_INVITATION',
  'SERVICE_ITEM',
  'SERVICE_MENU_GROUP',
  'BUSINESS_IMAGE',
  'PROMOTION',
  'PLAN',
  'ORDER',
  'PAYMENT',
  'AD_CAMPAIGN',
  'AD_CREATIVE',
  'CITY',
  'CATEGORY',
  'REVIEW'
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorRole" "UserRole",
  "action" "AuditAction" NOT NULL,
  "resourceType" "AuditResourceType" NOT NULL,
  "resourceId" TEXT,
  "businessId" TEXT,
  "cityId" TEXT,
  "targetUserId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_resourceType_idx" ON "AuditLog"("resourceType");
CREATE INDEX "AuditLog_businessId_idx" ON "AuditLog"("businessId");
CREATE INDEX "AuditLog_cityId_idx" ON "AuditLog"("cityId");
CREATE INDEX "AuditLog_businessId_createdAt_idx" ON "AuditLog"("businessId", "createdAt");
CREATE INDEX "AuditLog_cityId_createdAt_idx" ON "AuditLog"("cityId", "createdAt");

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
