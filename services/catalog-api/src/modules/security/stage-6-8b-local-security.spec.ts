import { assertProductionConfig } from '../../common/utils/production-config.util';
import { isWeakSecretValue } from '../../common/utils/secret-validation.util';
import { detectImageFormat } from '../../common/utils/image-magic-bytes.util';
describe('Stage 6.8B local security', () => {
  describe('production config fail-closed', () => {
    it('rejects DEV_LOGIN in production', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          jwtSecret: 'abcdefghijklmnopqrstuvwxyz0123456789ABCD',
          corsOrigins: 'https://admin.example.com',
          otpDebug: false,
          devLoginEnabled: true,
          mockPlanCheckoutEnabled: false,
          internalServiceToken: 'abcdefghijklmnopqrstuvwxyz0123456789ABCD',
          otpAuthEnabled: true,
        }),
      ).toThrow(/DEV_LOGIN_ENABLED/);
    });

    it('rejects weak JWT secret', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          jwtSecret: 'dev-secret-change-me-32-chars-minimum!!',
          corsOrigins: 'https://admin.example.com',
          otpDebug: false,
          devLoginEnabled: false,
          mockPlanCheckoutEnabled: false,
          internalServiceToken: 'abcdefghijklmnopqrstuvwxyz0123456789ABCD',
          otpAuthEnabled: true,
        }),
      ).toThrow(/JWT_SECRET/);
    });

    it('rejects missing AI internal token when AI enabled', () => {
      expect(() =>
        assertProductionConfig({
          nodeEnv: 'production',
          jwtSecret: 'abcdefghijklmnopqrstuvwxyz0123456789ABCD',
          corsOrigins: 'https://admin.example.com',
          otpDebug: false,
          devLoginEnabled: false,
          mockPlanCheckoutEnabled: false,
          internalServiceToken: '',
          aiIntegrationEnabled: true,
          otpAuthEnabled: true,
        }),
      ).toThrow(/QALAGO_INTERNAL_SERVICE_TOKEN/);
    });
  });

  describe('secret validation', () => {
    it('rejects obvious placeholders', () => {
      expect(isWeakSecretValue('change-me')).toBe(true);
      expect(isWeakSecretValue('abcdefghijklmnopqrstuvwxyz0123456789ABCD')).toBe(false);
    });
  });

  describe('upload magic bytes', () => {
    it('rejects fake JPEG MIME content', () => {
      const buf = Buffer.from('not-an-image');
      expect(detectImageFormat(buf)).toBeNull();
    });

    it('accepts PNG signature', () => {
      const buf = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
      ]);
      expect(detectImageFormat(buf)).toBe('png');
    });
  });

});
