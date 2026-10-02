import { isWeakSecretValue, assertStrongSecret } from './secret-validation.util';

export type ProductionConfigInput = {
  nodeEnv: string;
  qalagoEnv?: string;
  jwtSecret: string;
  corsOrigins: string;
  otpDebug: boolean;
  devLoginEnabled: boolean;
  mockPlanCheckoutEnabled: boolean;
  internalServiceToken?: string;
  aiIntegrationEnabled?: boolean;
  testAuthBypassEnabled?: boolean;
  googleAuthEnabled?: boolean;
  googleClientIdAndroid?: string;
  googleClientIdIos?: string;
  googleClientIdWeb?: string;
  appleAuthEnabled?: boolean;
  appleClientIdIos?: string;
  appleClientIdWeb?: string;
  otpAuthEnabled?: boolean;
  databaseUrl?: string;
  consumerWebBaseUrl?: string;
  businessWebBaseUrl?: string;
  geocodingProvider?: string;
  pushEnabled?: boolean;
  firebaseProjectId?: string;
  firebaseClientEmail?: string;
  firebasePrivateKey?: string;
  staffMfaRequired?: boolean;
  staffMfaEncryptionKey?: string;
};

/** Production runtime with full public launch constraints (not Docker staging QA). */
export function isStrictProductionEnv(nodeEnv: string, qalagoEnv?: string): boolean {
  if (nodeEnv !== 'production') {
    return false;
  }
  const env = (qalagoEnv ?? 'PRODUCTION').toUpperCase();
  return env === 'PRODUCTION';
}

function parseOrigins(corsOrigins: string): string[] {
  return corsOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function isLocalhostLikeHost(value: string): boolean {
  return /localhost|127\.0\.0\.1|\[::1\]/i.test(value);
}

function assertHttpsPublicBaseUrl(label: string, url: string | undefined): void {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) {
    throw new Error(`${label} must be set to an HTTPS public URL in production`);
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${label} must be a valid URL in production`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`${label} must use HTTPS in production`);
  }
  if (isLocalhostLikeHost(parsed.hostname)) {
    throw new Error(`${label} must not use localhost in production`);
  }
}

function assertProductionDatabaseUrl(databaseUrl: string | undefined): void {
  const trimmed = databaseUrl?.trim() ?? '';
  if (!trimmed) {
    throw new Error('DATABASE_URL must be set in production');
  }
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    throw new Error('DATABASE_URL must use a postgresql:// connection string in production');
  }
  if (isLocalhostLikeHost(trimmed)) {
    throw new Error('DATABASE_URL must not point to localhost in production');
  }
}

function assertProductionCorsOrigins(origins: readonly string[]): void {
  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS must be explicitly set in production');
  }
  for (const origin of origins) {
    if (origin === '*') {
      throw new Error('CORS_ORIGINS must not contain wildcard when credentials are enabled');
    }
    if (isLocalhostLikeHost(origin)) {
      throw new Error('CORS_ORIGINS must not include localhost in production');
    }
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error('CORS_ORIGINS must contain valid origin URLs in production');
    }
    if (parsed.protocol !== 'https:') {
      throw new Error('CORS_ORIGINS entries must use HTTPS in production');
    }
  }
}

export function assertProductionConfig(input: ProductionConfigInput): void {
  if (input.nodeEnv !== 'production') {
    return;
  }

  const strict = isStrictProductionEnv(input.nodeEnv, input.qalagoEnv);
  const errors: string[] = [];

  const qalagoEnv = (input.qalagoEnv ?? 'PRODUCTION').toUpperCase();
  if (qalagoEnv !== 'PRODUCTION' && qalagoEnv !== 'STAGING' && qalagoEnv !== 'LOCAL') {
    errors.push('QALAGO_ENV must be PRODUCTION, STAGING, or LOCAL');
  }
  if (strict && qalagoEnv !== 'PRODUCTION') {
    errors.push('QALAGO_ENV must be PRODUCTION when NODE_ENV=production for public production deploy');
  }
  if (input.nodeEnv === 'production' && qalagoEnv === 'LOCAL') {
    errors.push('QALAGO_ENV must not be LOCAL when NODE_ENV=production (use STAGING or PRODUCTION)');
  }

  if (input.otpDebug && strict) {
    errors.push('OTP_DEBUG must be false in production');
  }
  if (input.devLoginEnabled) {
    errors.push('DEV_LOGIN_ENABLED must be false in production');
  }
  if (input.mockPlanCheckoutEnabled) {
    errors.push('MOCK_PLAN_CHECKOUT_ENABLED must be false in production');
  }
  if (input.testAuthBypassEnabled) {
    errors.push('TEST_AUTH_BYPASS_ENABLED must be false in production');
  }

  const origins = parseOrigins(input.corsOrigins);

  if (strict) {
    try {
      assertProductionDatabaseUrl(input.databaseUrl);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid DATABASE_URL');
    }
    try {
      assertProductionCorsOrigins(origins);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid CORS_ORIGINS');
    }
    try {
      assertHttpsPublicBaseUrl('CONSUMER_WEB_BASE_URL', input.consumerWebBaseUrl);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid CONSUMER_WEB_BASE_URL');
    }
    try {
      assertHttpsPublicBaseUrl('BUSINESS_WEB_BASE_URL', input.businessWebBaseUrl);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid BUSINESS_WEB_BASE_URL');
    }
    if ((input.geocodingProvider ?? 'mock').toLowerCase() === 'mock') {
      errors.push('QALAGO_GEOCODING_PROVIDER must not be mock in production (set maptiler or future provider)');
    }
    if (input.pushEnabled) {
      if (!input.firebaseProjectId?.trim()) {
        errors.push('FIREBASE_PROJECT_ID must be set when PUSH_ENABLED=true in production');
      }
      if (!input.firebaseClientEmail?.trim()) {
        errors.push('FIREBASE_CLIENT_EMAIL must be set when PUSH_ENABLED=true in production');
      }
      if (!input.firebasePrivateKey?.trim()) {
        errors.push('FIREBASE_PRIVATE_KEY must be set when PUSH_ENABLED=true in production');
      }
    }
    if (input.staffMfaRequired) {
      try {
        assertStrongSecret('STAFF_MFA_ENCRYPTION_KEY', input.staffMfaEncryptionKey ?? '');
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Invalid STAFF_MFA_ENCRYPTION_KEY');
      }
    }
  } else if (qalagoEnv === 'STAGING') {
    if (origins.length === 0) {
      errors.push('CORS_ORIGINS must be explicitly set when NODE_ENV=production (staging stack)');
    }
  }

  const secret = input.jwtSecret.trim();
  if (!secret) {
    errors.push('JWT_SECRET must be set in production');
  } else if (strict && isWeakSecretValue(secret)) {
    errors.push('JWT_SECRET must be a strong secret (min 32 chars, no known placeholders)');
  }

  const aiEnabled = input.aiIntegrationEnabled !== false;
  const internalToken = input.internalServiceToken?.trim() ?? '';
  if (aiEnabled && strict && !internalToken) {
    errors.push(
      'QALAGO_INTERNAL_SERVICE_TOKEN must be set in production when AI integration is enabled',
    );
  } else if (internalToken && strict && isWeakSecretValue(internalToken)) {
    errors.push(
      'QALAGO_INTERNAL_SERVICE_TOKEN must not use a known development placeholder in production',
    );
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
