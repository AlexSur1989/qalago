-- Stage 6.11D.1: one review per user+business and rating range integrity.

ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_userId_businessId_key";
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_businessId_key" UNIQUE ("userId", "businessId");

ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_rating_range_check";
ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_range_check" CHECK ("rating" >= 1 AND "rating" <= 5);
