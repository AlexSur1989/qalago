-- 6.13M.4 — additive PlanPayment billing lifecycle (PENDING → COMPLETED)

ALTER TYPE "PlanPaymentStatus" ADD VALUE 'PENDING';
ALTER TYPE "PlanPaymentStatus" ADD VALUE 'CANCELLED';

ALTER TABLE "PlanPayment" ADD COLUMN IF NOT EXISTS "periodDays" INTEGER;
ALTER TABLE "PlanPayment" ADD COLUMN IF NOT EXISTS "provider" "PaymentProvider" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "PlanPayment" ADD COLUMN IF NOT EXISTS "providerReference" TEXT;
ALTER TABLE "PlanPayment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "PlanPayment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "PlanPayment" ALTER COLUMN "paidAt" DROP DEFAULT;
ALTER TABLE "PlanPayment" ALTER COLUMN "paidAt" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "PlanPayment_idempotencyKey_key" ON "PlanPayment"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "PlanPayment_businessId_status_idx" ON "PlanPayment"("businessId", "status");
CREATE INDEX IF NOT EXISTS "PlanPayment_status_createdAt_idx" ON "PlanPayment"("status", "createdAt");
