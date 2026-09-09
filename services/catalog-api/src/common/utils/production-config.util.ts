const WEAK_JWT_PATTERNS = [
  'dev-secret',
  'change-me',
  'qalago-staging-jwt',
  'ci-test-secret',
];

export type ProductionConfigInput = {
  nodeEnv: string;
  jwtSecret: string;
  corsOrigins: string;
  otpDebug: boolean;
  devLoginEnabled: boolean;
  mockPlanCheckoutEnabled: boolean;
};

export function assertProductionConfig(input: ProductionConfigInput): void {
  if (input.nodeEnv !== 'production') {
    return;
  }

  const errors: string[] = [];

  if (input.otpDebug) {
    errors.push('OTP_DEBUG must be false in production');
  }
  if (input.devLoginEnabled) {
    errors.push('DEV_LOGIN_ENABLED must be false in production');
  }
  if (input.mockPlanCheckoutEnabled) {
    errors.push('MOCK_PLAN_CHECKOUT_ENABLED must be false in production');
  }

  const origins = input.corsOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    errors.push('CORS_ORIGINS must be explicitly set in production');
  }
  if (origins.some((o) => o === '*')) {
    errors.push('CORS_ORIGINS must not contain wildcard when credentials are enabled');
  }

  const secret = input.jwtSecret.trim();
  if (secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters in production');
  }
  const lower = secret.toLowerCase();
  if (WEAK_JWT_PATTERNS.some((pattern) => lower.includes(pattern))) {
    errors.push('JWT_SECRET must not use a known development placeholder in production');
  }

  if (errors.length > 0) {
    throw new Error(`Production configuration invalid:\n- ${errors.join('\n- ')}`);
  }
}

export function isProductionNodeEnv(nodeEnv: string | undefined): boolean {
  return nodeEnv === 'production';
}

export function isMockPlanCheckoutAllowed(
  nodeEnv: string | undefined,
  mockPlanCheckoutEnabled: boolean,
): boolean {
  if (isProductionNodeEnv(nodeEnv)) {
    return false;
  }
  return mockPlanCheckoutEnabled;
}
