import {
  assertProductionConfig,
  isMockPlanCheckoutAllowed,
  isProductionNodeEnv,
} from './production-config.util';

describe('production-config.util', () => {
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

    it('rejects production without CORS_ORIGINS', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          jwtSecret: 'a'.repeat(32),
          corsOrigins: '',
          otpDebug: false,
          devLoginEnabled: false,
          mockPlanCheckoutEnabled: false,
        }),
      ).toThrow(/CORS_ORIGINS must be explicitly set/);
    });

    it('rejects production wildcard CORS', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          jwtSecret: 'a'.repeat(32),
          corsOrigins: '*',
          otpDebug: false,
          devLoginEnabled: false,
          mockPlanCheckoutEnabled: false,
        }),
      ).toThrow(/wildcard/);
    });

    it('rejects production OTP_DEBUG', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          jwtSecret: 'a'.repeat(32),
          corsOrigins: 'https://qalago.kz',
          otpDebug: true,
          devLoginEnabled: false,
          mockPlanCheckoutEnabled: false,
        }),
      ).toThrow(/OTP_DEBUG/);
    });

    it('rejects production DEV_LOGIN_ENABLED', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          jwtSecret: 'a'.repeat(32),
          corsOrigins: 'https://qalago.kz',
          otpDebug: false,
          devLoginEnabled: true,
          mockPlanCheckoutEnabled: false,
        }),
      ).toThrow(/DEV_LOGIN_ENABLED/);
    });

    it('rejects production GOOGLE_AUTH_ENABLED without client IDs', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          jwtSecret: 'a'.repeat(32),
          corsOrigins: 'https://qalago.kz',
          otpDebug: false,
          devLoginEnabled: false,
          mockPlanCheckoutEnabled: false,
          googleAuthEnabled: true,
          googleClientIdAndroid: '',
          googleClientIdIos: '',
          googleClientIdWeb: '',
        }),
      ).toThrow(/GOOGLE_CLIENT_ID/);
    });

    it('allows production GOOGLE_AUTH_ENABLED with at least one client ID', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          jwtSecret: 'a'.repeat(32),
          corsOrigins: 'https://qalago.kz',
          otpDebug: false,
          devLoginEnabled: false,
          mockPlanCheckoutEnabled: false,
          googleAuthEnabled: true,
          googleClientIdWeb: 'web-client.apps.googleusercontent.com',
        }),
      ).not.toThrow();
    });

    it('rejects weak JWT in production', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          jwtSecret: 'dev-secret-change-me',
          corsOrigins: 'https://qalago.kz',
          otpDebug: false,
          devLoginEnabled: false,
          mockPlanCheckoutEnabled: false,
        }),
      ).toThrow(/JWT_SECRET/);
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
