-- CreateEnum
CREATE TYPE "NotificationTargetType" AS ENUM ('BUSINESS', 'REVIEW', 'PROMOTION', 'BUSINESS_APPLICATION', 'OWNERSHIP_CLAIM', 'PLAN', 'ORDER', 'PAYMENT', 'AD_CAMPAIGN', 'MODERATION_CASE');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "targetType" "NotificationTargetType",
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "payload" JSONB;

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
