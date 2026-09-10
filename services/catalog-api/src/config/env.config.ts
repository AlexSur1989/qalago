export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3002', 10),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me-32-chars-min',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    otpDebug: process.env.OTP_DEBUG === 'true',
    devLoginEnabled: process.env.DEV_LOGIN_ENABLED === 'true',
    otpAuthEnabled: process.env.OTP_AUTH_ENABLED !== 'false',
    googleAuthEnabled: process.env.GOOGLE_AUTH_ENABLED === 'true',
    googleClientIdAndroid: process.env.GOOGLE_CLIENT_ID_ANDROID ?? '',
    googleClientIdIos: process.env.GOOGLE_CLIENT_ID_IOS ?? '',
    googleClientIdWeb: process.env.GOOGLE_CLIENT_ID_WEB ?? '',
    googleAuthIpLimit: parseInt(process.env.GOOGLE_AUTH_IP_LIMIT ?? '20', 10),
    googleAuthIpWindowSeconds: parseInt(process.env.GOOGLE_AUTH_IP_WINDOW_SECONDS ?? '900', 10),
    appleAuthEnabled: process.env.APPLE_AUTH_ENABLED === 'true',
    appleClientIdIos: process.env.APPLE_CLIENT_ID_IOS ?? '',
    appleClientIdWeb: process.env.APPLE_CLIENT_ID_WEB ?? '',
    socialAuthIpLimit: parseInt(
      process.env.SOCIAL_AUTH_IP_LIMIT ?? process.env.GOOGLE_AUTH_IP_LIMIT ?? '20',
      10,
    ),
    socialAuthIpWindowSeconds: parseInt(
      process.env.SOCIAL_AUTH_IP_WINDOW_SECONDS ??
        process.env.GOOGLE_AUTH_IP_WINDOW_SECONDS ??
        '900',
      10,
    ),
    mockPlanCheckoutEnabled: process.env.MOCK_PLAN_CHECKOUT_ENABLED === 'true',
    otpSendCooldownSeconds: parseInt(process.env.OTP_SEND_COOLDOWN_SECONDS ?? '60', 10),
    otpSendPhoneLimit: parseInt(process.env.OTP_SEND_PHONE_LIMIT ?? '5', 10),
    otpSendPhoneWindowSeconds: parseInt(process.env.OTP_SEND_PHONE_WINDOW_SECONDS ?? '3600', 10),
    otpSendIpLimit: parseInt(process.env.OTP_SEND_IP_LIMIT ?? '20', 10),
    otpSendIpWindowSeconds: parseInt(process.env.OTP_SEND_IP_WINDOW_SECONDS ?? '3600', 10),
    otpVerifyMaxAttempts: parseInt(process.env.OTP_VERIFY_MAX_ATTEMPTS ?? '5', 10),
    otpVerifyWindowSeconds: parseInt(process.env.OTP_VERIFY_WINDOW_SECONDS ?? '900', 10),
    analyticsEventsIpLimit: parseInt(process.env.ANALYTICS_EVENTS_IP_LIMIT ?? '300', 10),
    analyticsEventsWindowSeconds: parseInt(process.env.ANALYTICS_EVENTS_WINDOW_SECONDS ?? '60', 10),
    businessWebBaseUrl: process.env.BUSINESS_WEB_BASE_URL ?? 'http://localhost:3003',
    teamInviteTtlDays: parseInt(process.env.TEAM_INVITE_TTL_DAYS ?? '7', 10),
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
