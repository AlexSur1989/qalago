-- Stage 6.9: Legal, safety, moderation & data-rights foundation (additive)

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "moderationHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "moderationHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BusinessImage" ADD COLUMN IF NOT EXISTS "moderationHidden" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Review_businessId_moderationHidden_idx" ON "Review"("businessId", "moderationHidden");
CREATE INDEX IF NOT EXISTS "BusinessImage_businessId_moderationHidden_idx" ON "BusinessImage"("businessId", "moderationHidden");

-- Enums
CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'COMMUNITY_GUIDELINES', 'BUSINESS_TERMS', 'ADVERTISING_TERMS');
CREATE TYPE "LegalDocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LegalLocale" AS ENUM ('RU', 'KK');
CREATE TYPE "LegalAcceptanceSource" AS ENUM ('SIGN_UP', 'LOGIN', 'PROFILE', 'BUSINESS_APPLICATION', 'CHECKOUT', 'RECONSENT');
CREATE TYPE "DataRightsRequestType" AS ENUM ('ACCESS', 'EXPORT', 'CORRECTION', 'DELETE_ACCOUNT', 'DELETE_DATA', 'OTHER');
CREATE TYPE "DataRightsRequestStatus" AS ENUM ('SUBMITTED', 'IDENTITY_VERIFICATION_REQUIRED', 'IN_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ContentReportTargetType" AS ENUM ('BUSINESS', 'REVIEW', 'PROMOTION', 'MEDIA', 'USER');
CREATE TYPE "ContentReportReason" AS ENUM ('SPAM', 'FRAUD_OR_SCAM', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'FALSE_INFORMATION', 'IMPERSONATION', 'COPYRIGHT_OR_IP', 'PRIVACY', 'DANGEROUS_OR_ILLEGAL', 'OTHER');
CREATE TYPE "ContentReportStatus" AS ENUM ('OPEN', 'LINKED_TO_CASE', 'DISMISSED', 'CLOSED');
CREATE TYPE "ModerationCaseType" AS ENUM ('CONTENT_REPORT', 'MANUAL', 'APPEAL');
CREATE TYPE "ModerationCaseStatus" AS ENUM ('OPEN', 'TRIAGED', 'IN_REVIEW', 'ACTION_REQUIRED', 'RESOLVED', 'DISMISSED', 'APPEALED');
CREATE TYPE "ModerationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "ModerationActionType" AS ENUM ('NO_ACTION', 'CONTENT_HIDE', 'CONTENT_RESTORE', 'USER_SUSPEND', 'USER_RESTORE', 'BUSINESS_HIDE', 'BUSINESS_RESTORE', 'PROMOTION_HIDE', 'PROMOTION_RESTORE', 'REVIEW_HIDE', 'REVIEW_RESTORE', 'MEDIA_HIDE', 'MEDIA_RESTORE');
CREATE TYPE "ModerationAppealStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'UPHELD', 'OVERTURNED', 'CANCELLED');
CREATE TYPE "GovernmentRequestStatus" AS ENUM ('RECEIVED', 'VERIFICATION_REQUIRED', 'VERIFIED', 'IN_REVIEW', 'RESPONDED', 'REJECTED', 'CLOSED');
CREATE TYPE "SecurityIncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "SecurityIncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'POSTMORTEM');

CREATE TABLE "LegalDocument" (
  "id" TEXT NOT NULL,
  "type" "LegalDocumentType" NOT NULL,
  "version" TEXT NOT NULL,
  "locale" "LegalLocale" NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" "LegalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "requiresReacceptance" BOOLEAN NOT NULL DEFAULT false,
  "effectiveAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LegalDocument_type_version_locale_key" ON "LegalDocument"("type", "version", "locale");
CREATE INDEX "LegalDocument_type_status_effectiveAt_idx" ON "LegalDocument"("type", "status", "effectiveAt");

CREATE TABLE "LegalAcceptance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "acceptanceSource" "LegalAcceptanceSource" NOT NULL,
  "locale" "LegalLocale" NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalAcceptance_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LegalAcceptance_userId_documentId_idx" ON "LegalAcceptance"("userId", "documentId");
CREATE INDEX "LegalAcceptance_userId_acceptedAt_idx" ON "LegalAcceptance"("userId", "acceptedAt");
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "DataRightsRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "DataRightsRequestType" NOT NULL,
  "status" "DataRightsRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "reasonCode" TEXT,
  "adminNote" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DataRightsRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DataRightsRequest_userId_status_idx" ON "DataRightsRequest"("userId", "status");
CREATE INDEX "DataRightsRequest_status_requestedAt_idx" ON "DataRightsRequest"("status", "requestedAt");
ALTER TABLE "DataRightsRequest" ADD CONSTRAINT "DataRightsRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContentReport" (
  "id" TEXT NOT NULL,
  "reporterUserId" TEXT,
  "targetType" "ContentReportTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "reason" "ContentReportReason" NOT NULL,
  "details" TEXT,
  "status" "ContentReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContentReport_targetType_targetId_status_idx" ON "ContentReport"("targetType", "targetId", "status");
CREATE INDEX "ContentReport_reporterUserId_targetType_targetId_idx" ON "ContentReport"("reporterUserId", "targetType", "targetId");
CREATE INDEX "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt");
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ModerationCase" (
  "id" TEXT NOT NULL,
  "caseType" "ModerationCaseType" NOT NULL DEFAULT 'CONTENT_REPORT',
  "status" "ModerationCaseStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "ModerationPriority" NOT NULL DEFAULT 'NORMAL',
  "targetType" "ContentReportTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "cityId" TEXT,
  "assignedAdminId" TEXT,
  "targetSnapshot" JSONB,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ModerationCase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ModerationCase_status_priority_idx" ON "ModerationCase"("status", "priority");
CREATE INDEX "ModerationCase_cityId_status_idx" ON "ModerationCase"("cityId", "status");
CREATE INDEX "ModerationCase_targetType_targetId_idx" ON "ModerationCase"("targetType", "targetId");
ALTER TABLE "ModerationCase" ADD CONSTRAINT "ModerationCase_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModerationCase" ADD CONSTRAINT "ModerationCase_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ModerationCaseReport" (
  "caseId" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  CONSTRAINT "ModerationCaseReport_pkey" PRIMARY KEY ("caseId","reportId")
);
ALTER TABLE "ModerationCaseReport" ADD CONSTRAINT "ModerationCaseReport_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ModerationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModerationCaseReport" ADD CONSTRAINT "ModerationCaseReport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ContentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ModerationAction" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "actorAdminId" TEXT NOT NULL,
  "actionType" "ModerationActionType" NOT NULL,
  "targetType" "ContentReportTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "reasonCode" TEXT,
  "internalNote" TEXT,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ModerationAction_caseId_createdAt_idx" ON "ModerationAction"("caseId", "createdAt");
CREATE INDEX "ModerationAction_targetType_targetId_idx" ON "ModerationAction"("targetType", "targetId");
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ModerationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ModerationAppeal" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "appellantUserId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "ModerationAppealStatus" NOT NULL DEFAULT 'SUBMITTED',
  "decisionNote" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ModerationAppeal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ModerationAppeal_caseId_status_idx" ON "ModerationAppeal"("caseId", "status");
CREATE INDEX "ModerationAppeal_appellantUserId_status_idx" ON "ModerationAppeal"("appellantUserId", "status");
ALTER TABLE "ModerationAppeal" ADD CONSTRAINT "ModerationAppeal_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ModerationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModerationAppeal" ADD CONSTRAINT "ModerationAppeal_appellantUserId_fkey" FOREIGN KEY ("appellantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GovernmentRequest" (
  "id" TEXT NOT NULL,
  "referenceNumber" TEXT,
  "requestingAuthority" TEXT NOT NULL,
  "requestType" TEXT NOT NULL,
  "status" "GovernmentRequestStatus" NOT NULL DEFAULT 'RECEIVED',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "assignedAdminId" TEXT,
  "legalBasisNote" TEXT,
  "responseSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GovernmentRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GovernmentRequest_status_receivedAt_idx" ON "GovernmentRequest"("status", "receivedAt");
ALTER TABLE "GovernmentRequest" ADD CONSTRAINT "GovernmentRequest_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SecurityIncident" (
  "id" TEXT NOT NULL,
  "severity" "SecurityIncidentSeverity" NOT NULL,
  "status" "SecurityIncidentStatus" NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "containedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "ownerAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SecurityIncident_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SecurityIncident_status_severity_idx" ON "SecurityIncident"("status", "severity");
ALTER TABLE "SecurityIncident" ADD CONSTRAINT "SecurityIncident_ownerAdminId_fkey" FOREIGN KEY ("ownerAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'LEGAL_DOCUMENT_CREATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'LEGAL_DOCUMENT_PUBLISH';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'LEGAL_DOCUMENT_ARCHIVE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DATA_REQUEST_STATUS_CHANGE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MODERATION_CASE_ASSIGN';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MODERATION_ACTION_APPLY';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MODERATION_ACTION_RESTORE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MODERATION_APPEAL_DECIDE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'GOVERNMENT_REQUEST_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SECURITY_INCIDENT_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_DELETION_EXECUTE';

ALTER TYPE "AuditResourceType" ADD VALUE IF NOT EXISTS 'LEGAL_DOCUMENT';
ALTER TYPE "AuditResourceType" ADD VALUE IF NOT EXISTS 'DATA_RIGHTS_REQUEST';
ALTER TYPE "AuditResourceType" ADD VALUE IF NOT EXISTS 'CONTENT_REPORT';
ALTER TYPE "AuditResourceType" ADD VALUE IF NOT EXISTS 'MODERATION_CASE';
ALTER TYPE "AuditResourceType" ADD VALUE IF NOT EXISTS 'MODERATION_APPEAL';
ALTER TYPE "AuditResourceType" ADD VALUE IF NOT EXISTS 'GOVERNMENT_REQUEST';
ALTER TYPE "AuditResourceType" ADD VALUE IF NOT EXISTS 'SECURITY_INCIDENT';
