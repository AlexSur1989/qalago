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
  googleAuthEnabled?: boolean;
  googleClientIdAndroid?: string;
  googleClientIdIos?: string;
  googleClientIdWeb?: string;
  appleAuthEnabled?: boolean;
  appleClientIdIos?: string;
  appleClientIdWeb?: string;
  otpAuthEnabled?: boolean;
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

  if (input.googleAuthEnabled) {
    const googleClientIds = [
      input.googleClientIdAndroid,
      input.googleClientIdIos,
      input.googleClientIdWeb,
    ]
      .map((id) => id?.trim())
      .filter(Boolean);
    if (googleClientIds.length === 0) {
      errors.push(
        'At least one GOOGLE_CLIENT_ID_* must be set when GOOGLE_AUTH_ENABLED=true in production',
      );
    }
  }

  if (input.appleAuthEnabled) {
    const appleClientIds = [input.appleClientIdIos, input.appleClientIdWeb]
      .map((id) => id?.trim())
      .filter(Boolean);
    if (appleClientIds.length === 0) {
      errors.push(
        'At least one APPLE_CLIENT_ID_* must be set when APPLE_AUTH_ENABLED=true in production',
      );
    }
  }

  const otpEnabled = input.otpAuthEnabled !== false;
  const googleEnabled = input.googleAuthEnabled === true;
  const appleEnabled = input.appleAuthEnabled === true;
  if (!otpEnabled && !googleEnabled && !appleEnabled) {
    errors.push(
      'At least one auth method must be enabled in production (OTP_AUTH_ENABLED, GOOGLE_AUTH_ENABLED, or APPLE_AUTH_ENABLED)',
    );
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
