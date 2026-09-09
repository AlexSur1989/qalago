export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me-32-chars-min',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    otpDebug: process.env.OTP_DEBUG === 'true',
    devLoginEnabled: process.env.DEV_LOGIN_ENABLED === 'true',
    defaultCitySlug: process.env.DEFAULT_CITY_SLUG ?? 'uralsk',
    corsOrigins: process.env.CORS_ORIGINS ?? '',
    uploadDir: process.env.UPLOAD_DIR ?? './uploads',
    maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB ?? '5', 10),
    aiOrchestratorUrl: process.env.AI_ORCHESTRATOR_URL ?? 'http://localhost:3004',
    internalServiceToken: process.env.QALAGO_INTERNAL_SERVICE_TOKEN ?? '',
    businessApplicationCreateLimit: parseInt(
      process.env.BUSINESS_APPLICATION_CREATE_LIMIT ?? '5',
      10,
    ),
    businessApplicationCreateWindowSeconds: parseInt(
      process.env.BUSINESS_APPLICATION_CREATE_WINDOW_SECONDS ?? '3600',
      10,
    ),
    businessApplicationSubmitLimit: parseInt(
      process.env.BUSINESS_APPLICATION_SUBMIT_LIMIT ?? '10',
      10,
    ),
    businessApplicationSubmitWindowSeconds: parseInt(
      process.env.BUSINESS_APPLICATION_SUBMIT_WINDOW_SECONDS ?? '3600',
      10,
    ),
    ownershipClaimCreateLimit: parseInt(
      process.env.OWNERSHIP_CLAIM_CREATE_LIMIT ?? '5',
      10,
    ),
    ownershipClaimCreateWindowSeconds: parseInt(
      process.env.OWNERSHIP_CLAIM_CREATE_WINDOW_SECONDS ?? '3600',
      10,
    ),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
});
