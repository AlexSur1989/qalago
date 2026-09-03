export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me-32-chars-min',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    otpDebug: process.env.OTP_DEBUG === 'true',
    defaultCitySlug: process.env.DEFAULT_CITY_SLUG ?? 'uralsk',
    corsOrigins: process.env.CORS_ORIGINS ?? '',
    uploadDir: process.env.UPLOAD_DIR ?? './uploads',
    maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB ?? '5', 10),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
});
