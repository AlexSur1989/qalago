-- KZ-C.2: idempotent legal acceptance per user/document/version
CREATE UNIQUE INDEX "LegalAcceptance_userId_documentId_documentVersion_key"
ON "LegalAcceptance"("userId", "documentId", "documentVersion");
