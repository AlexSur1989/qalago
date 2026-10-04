-- 6.15L.2 — additive LegalDocumentType values (no data changes)
ALTER TYPE "LegalDocumentType" ADD VALUE IF NOT EXISTS 'PERSONAL_DATA_CONSENT';
ALTER TYPE "LegalDocumentType" ADD VALUE IF NOT EXISTS 'PUBLIC_OFFER';
