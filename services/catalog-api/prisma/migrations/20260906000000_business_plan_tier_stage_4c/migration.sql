-- Stage 4C: Migrate BusinessPlanTier BASIC/PRO/TOP_CITY → FREE/BASIC/PREMIUM/VIP
-- Mapping: legacy BASIC → FREE, PRO → PREMIUM, TOP_CITY → VIP
-- Safe enum swap (no table recreation)

CREATE TYPE "BusinessPlanTier_new" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'VIP');

ALTER TABLE "Business" ALTER COLUMN "planTier" DROP DEFAULT;

ALTER TABLE "Business"
  ALTER COLUMN "planTier" TYPE "BusinessPlanTier_new"
  USING (
    CASE "planTier"::text
      WHEN 'BASIC' THEN 'FREE'::"BusinessPlanTier_new"
      WHEN 'PRO' THEN 'PREMIUM'::"BusinessPlanTier_new"
      WHEN 'TOP_CITY' THEN 'VIP'::"BusinessPlanTier_new"
      ELSE 'FREE'::"BusinessPlanTier_new"
    END
  );

ALTER TABLE "PlanPayment"
  ALTER COLUMN "tier" TYPE "BusinessPlanTier_new"
  USING (
    CASE "tier"::text
      WHEN 'BASIC' THEN 'FREE'::"BusinessPlanTier_new"
      WHEN 'PRO' THEN 'PREMIUM'::"BusinessPlanTier_new"
      WHEN 'TOP_CITY' THEN 'VIP'::"BusinessPlanTier_new"
      ELSE 'FREE'::"BusinessPlanTier_new"
    END
  );

DROP TYPE "BusinessPlanTier";

ALTER TYPE "BusinessPlanTier_new" RENAME TO "BusinessPlanTier";

ALTER TABLE "Business" ALTER COLUMN "planTier" SET DEFAULT 'FREE'::"BusinessPlanTier";
