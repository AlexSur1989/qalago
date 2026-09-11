export const RateLimitPolicy = {
  AUTH_STRICT: { limit: 30, windowSeconds: 900 },
  OTP_STRICT: { limit: 5, windowSeconds: 3600 },
  WRITE_STANDARD: { limit: 120, windowSeconds: 60 },
  PUBLIC_READ: { limit: 600, windowSeconds: 60 },
  SEARCH: { limit: 90, windowSeconds: 60 },
  ANALYTICS_INGEST: { limit: 300, windowSeconds: 60 },
  UPLOAD: { limit: 30, windowSeconds: 3600 },
  CLAIM_APPLICATION: { limit: 5, windowSeconds: 3600 },
  AD_ORDER: { limit: 20, windowSeconds: 3600 },
  AI: { limit: 60, windowSeconds: 60 },
} as const;

export type RateLimitPolicyName = keyof typeof RateLimitPolicy;
