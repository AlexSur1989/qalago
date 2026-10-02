import {
  assertProductionConfig,
  isMockPlanCheckoutAllowed,
  isProductionNodeEnv,
  isStrictProductionEnv,
} from './production-config.util';

const prodAiToken = 'a'.repeat(48);

const strictProdBase = {
  nodeEnv: 'production' as const,
  qalagoEnv: 'PRODUCTION' as const,
  jwtSecret: 'a'.repeat(32),
  corsOrigins: 'https://qalago.kz',
  otpDebug: false,
  devLoginEnabled: false,
  mockPlanCheckoutEnabled: false,
  internalServiceToken: prodAiToken,
  databaseUrl: 'postgresql://qalago:secret@db.internal:5432/qalago?schema=public',
  consumerWebBaseUrl: 'https://qalago.kz',
  businessWebBaseUrl: 'https://business.qalago.kz',
  geocodingProvider: 'maptiler',
  otpAuthEnabled: true,
};

describe('production-config.util', () => {
  describe('isStrictProductionEnv', () => {
    it('treats NODE_ENV=production + QALAGO_ENV=PRODUCTION as strict', () => {
      expect(isStrictProductionEnv('production', 'PRODUCTION')).toBe(true);
    });
    it('treats staging profile as non-strict', () => {
      expect(isStrictProductionEnv('production', 'STAGING')).toBe(false);
    });
  });

  describe('assertProductionConfig', () => {
    it('allows development with empty CORS', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'development',
          jwtSecret: 'dev-secret',
          corsOrigins: '',
          otpDebug: true,
          devLoginEnabled: true,
          mockPlanCheckoutEnabled: true,
        }),
      ).not.toThrow();
    });

    it('rejects strict production without CORS_ORIGINS', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          corsOrigins: '',
        }),
      ).toThrow(/CORS_ORIGINS must be explicitly set/);
    });

    it('rejects production wildcard CORS', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          corsOrigins: '*',
        }),
      ).toThrow(/wildcard/);
    });

    it('rejects strict production localhost CORS', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          corsOrigins: 'http://localhost:3005',
        }),
      ).toThrow(/localhost/);
    });

    it('rejects strict production HTTP CORS', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          corsOrigins: 'http://qalago.kz',
        }),
      ).toThrow(/HTTPS/);
    });

    it('rejects strict production OTP_DEBUG', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          otpDebug: true,
        }),
      ).toThrow(/OTP_DEBUG/);
    });

    it('allows staging profile OTP_DEBUG with localhost CORS', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          qalagoEnv: 'STAGING',
          jwtSecret: 'a'.repeat(32),
          corsOrigins: 'http://localhost:3005',
          otpDebug: true,
          devLoginEnabled: false,
          mockPlanCheckoutEnabled: false,
          aiIntegrationEnabled: false,
          otpAuthEnabled: true,
        }),
      ).not.toThrow();
    });

    it('rejects production DEV_LOGIN_ENABLED', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          devLoginEnabled: true,
        }),
      ).toThrow(/DEV_LOGIN_ENABLED/);
    });

    it('rejects strict production missing DATABASE_URL', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          databaseUrl: '',
        }),
      ).toThrow(/DATABASE_URL/);
    });

    it('rejects strict production localhost DATABASE_URL', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          databaseUrl: 'postgresql://qalago:pass@localhost:5432/qalago',
        }),
      ).toThrow(/localhost/);
    });

    it('rejects production GOOGLE_AUTH_ENABLED without client IDs', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          googleAuthEnabled: true,
          googleClientIdAndroid: '',
          googleClientIdIos: '',
          googleClientIdWeb: '',
        }),
      ).toThrow(/GOOGLE_CLIENT_ID/);
    });

    it('rejects production APPLE_AUTH_ENABLED without client IDs', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          appleAuthEnabled: true,
          appleClientIdIos: '',
          appleClientIdWeb: '',
        }),
      ).toThrow(/APPLE_CLIENT_ID/);
    });

    it('allows production APPLE_AUTH_ENABLED with at least one client ID', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          appleAuthEnabled: true,
          appleClientIdIos: 'kz.qalago.qalagoMobile',
        }),
      ).not.toThrow();
    });

    it('allows production GOOGLE_AUTH_ENABLED with at least one client ID', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          googleAuthEnabled: true,
          googleClientIdWeb: 'web-client.apps.googleusercontent.com',
        }),
      ).not.toThrow();
    });

    it('rejects production when all auth methods are disabled', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          otpAuthEnabled: false,
          googleAuthEnabled: false,
          appleAuthEnabled: false,
        }),
      ).toThrow(/At least one auth method must be enabled/);
    });

    it('allows production OTP-only auth', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          otpAuthEnabled: true,
          googleAuthEnabled: false,
          appleAuthEnabled: false,
        }),
      ).not.toThrow();
    });

    it('rejects production when QALAGO_ENV is LOCAL', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          qalagoEnv: 'LOCAL',
        }),
      ).toThrow(/QALAGO_ENV/);
    });

    it('rejects weak JWT in strict production', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          jwtSecret: 'dev-secret-change-me',
        }),
      ).toThrow(/JWT_SECRET/);
    });

    it('rejects mock geocoding in strict production', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          geocodingProvider: 'mock',
        }),
      ).toThrow(/GEOCODING/);
    });

    it('rejects mock checkout flag in production', () => {
      expect(() =>
        assertProductionConfig({
          ...strictProdBase,
          mockPlanCheckoutEnabled: true,
        }),
      ).toThrow(/MOCK_PLAN_CHECKOUT/);
    });
  });

  describe('isMockPlanCheckoutAllowed', () => {
    it('blocks mock checkout in production regardless of flag', () => {
      expect(isMockPlanCheckoutAllowed('production', true)).toBe(false);
      expect(isMockPlanCheckoutAllowed('production', false)).toBe(false);
    });

    it('allows mock checkout in development when explicitly enabled', () => {
      expect(isMockPlanCheckoutAllowed('development', true)).toBe(true);
      expect(isMockPlanCheckoutAllowed('development', false)).toBe(false);
    });
  });

  describe('isProductionNodeEnv', () => {
    it('detects production', () => {
      expect(isProductionNodeEnv('production')).toBe(true);
      expect(isProductionNodeEnv('development')).toBe(false);
    });
  });
});
