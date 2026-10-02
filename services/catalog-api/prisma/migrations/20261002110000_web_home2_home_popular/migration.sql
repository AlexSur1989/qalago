-- WEB-HOME.2 — additive enum value (seed row in next migration; PG requires commit before use)

ALTER TYPE "HomeSectionType" ADD VALUE IF NOT EXISTS 'HOME_POPULAR';
