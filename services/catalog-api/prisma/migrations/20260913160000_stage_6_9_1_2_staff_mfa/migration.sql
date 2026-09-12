-- Stage 6.9.1.2 Staff MFA

CREATE TYPE "StaffMfaMethod" AS ENUM ('TOTP');

CREATE TABLE "StaffMfaCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" "StaffMfaMethod" NOT NULL DEFAULT 'TOTP',
    "secretEncrypted" TEXT,
    "pendingSecretEncrypted" TEXT,
    "pendingExpiresAt" TIMESTAMP(3),
    "enabledAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "lastTotpStep" BIGINT,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMfaCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffMfaRecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffMfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffMfaChallengeJti" (
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffMfaChallengeJti_pkey" PRIMARY KEY ("jti")
);

CREATE UNIQUE INDEX "StaffMfaCredential_userId_key" ON "StaffMfaCredential"("userId");
CREATE INDEX "StaffMfaCredential_enabledAt_idx" ON "StaffMfaCredential"("enabledAt");
CREATE INDEX "StaffMfaRecoveryCode_userId_usedAt_idx" ON "StaffMfaRecoveryCode"("userId", "usedAt");
CREATE INDEX "StaffMfaRecoveryCode_credentialId_idx" ON "StaffMfaRecoveryCode"("credentialId");
CREATE INDEX "StaffMfaChallengeJti_userId_idx" ON "StaffMfaChallengeJti"("userId");
CREATE INDEX "StaffMfaChallengeJti_expiresAt_idx" ON "StaffMfaChallengeJti"("expiresAt");

ALTER TABLE "StaffMfaCredential" ADD CONSTRAINT "StaffMfaCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffMfaRecoveryCode" ADD CONSTRAINT "StaffMfaRecoveryCode_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "StaffMfaCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "AuditAction" ADD VALUE 'STAFF_MFA_ENROLL_STARTED';
ALTER TYPE "AuditAction" ADD VALUE 'STAFF_MFA_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE 'STAFF_MFA_VERIFIED';
ALTER TYPE "AuditAction" ADD VALUE 'STAFF_MFA_RECOVERY_CODE_USED';
ALTER TYPE "AuditAction" ADD VALUE 'STAFF_MFA_RECOVERY_CODES_REGENERATED';
ALTER TYPE "AuditAction" ADD VALUE 'STAFF_MFA_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE 'STAFF_MFA_RESET';
ALTER TYPE "AuditAction" ADD VALUE 'STAFF_MFA_EMERGENCY_RESET';
ALTER TYPE "AuditAction" ADD VALUE 'STAFF_MFA_VERIFICATION_FAILED';
