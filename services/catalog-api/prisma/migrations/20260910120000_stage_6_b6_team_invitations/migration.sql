-- Stage 6.2B6: email + secure token invitations (legacy phone preserved)

ALTER TABLE "BusinessInvitation" ALTER COLUMN "phone" DROP NOT NULL;

ALTER TABLE "BusinessInvitation" ADD COLUMN "email" TEXT;
ALTER TABLE "BusinessInvitation" ADD COLUMN "tokenHash" TEXT;
ALTER TABLE "BusinessInvitation" ADD COLUMN "acceptedByUserId" TEXT;
ALTER TABLE "BusinessInvitation" ADD COLUMN "acceptedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "BusinessInvitation_tokenHash_key" ON "BusinessInvitation"("tokenHash");
CREATE INDEX "BusinessInvitation_businessId_email_idx" ON "BusinessInvitation"("businessId", "email");
CREATE INDEX "BusinessInvitation_email_status_idx" ON "BusinessInvitation"("email", "status");

ALTER TABLE "BusinessInvitation" ADD CONSTRAINT "BusinessInvitation_acceptedByUserId_fkey"
  FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
