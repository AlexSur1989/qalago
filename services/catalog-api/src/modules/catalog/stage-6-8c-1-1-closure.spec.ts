import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UserAvatarService } from '../users/user-avatar.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { FEATURE_FLAG_SAFE_DEFAULTS } from '../app-config/feature-flag.defaults';
import { FeatureFlagResolverService } from '../app-config/feature-flag-resolver.service';

describe('Stage 6.8C.1.1 — integration closure', () => {
  describe('Avatar arbitrary-URL protection (AX)', () => {
    it('ValidationPipe rejects avatarUrl in PATCH body', async () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
      await expect(
        pipe.transform(
          { name: 'Test', avatarUrl: 'https://evil.example/avatar.png' },
          { type: 'body', metatype: UpdateUserDto },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('Avatar replacement (BH)', () => {
    it('failed DB update does not leave user without prior avatar in DB', async () => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue({ avatarUrl: '/uploads/old.webp' }),
          update: jest.fn().mockRejectedValue(new Error('db down')),
        },
      };
      const rateLimits = {
        assertAllowed: jest.fn(),
        recordHit: jest.fn(),
      };
      const config = {
        get: jest.fn((key: string, def?: string) =>
          key === 'app.uploadDir' ? './uploads-test-closure' : def,
        ),
      };
      const service = new UserAvatarService(prisma as never, config as never, rateLimits as never);
      const png = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
        0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
        0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00,
        0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);
      await expect(
        service.uploadAvatar('user-1', {
          buffer: png,
          size: png.length,
        } as Express.Multer.File),
      ).rejects.toThrow();
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('Feature flags (11)', () => {
    const resolver = new FeatureFlagResolverService({} as never);

    it('subcategories global OFF; google/apple OFF', () => {
      expect(FEATURE_FLAG_SAFE_DEFAULTS.subcategoriesEnabled).toBe(false);
      expect(FEATURE_FLAG_SAFE_DEFAULTS.googleAuthEnabled).toBe(false);
      expect(FEATURE_FLAG_SAFE_DEFAULTS.appleAuthEnabled).toBe(false);
    });

    it('city override isolated', () => {
      const flags = [
        {
          key: 'subcategoriesEnabled',
          globalEnabled: false,
          androidEnabled: null,
          iosEnabled: null,
        },
      ];
      const a = resolver.resolve(
        flags,
        [{ flagKey: 'subcategoriesEnabled', enabled: true }],
        undefined,
        'c1',
      );
      const b = resolver.resolve(flags, [], undefined, 'c2');
      expect(a.subcategoriesEnabled).toBe(true);
      expect(b.subcategoriesEnabled).toBe(false);
    });
  });
});
