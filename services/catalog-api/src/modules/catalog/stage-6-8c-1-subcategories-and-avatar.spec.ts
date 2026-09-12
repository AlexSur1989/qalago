import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FEATURE_FLAG_SAFE_DEFAULTS } from '../app-config/feature-flag.defaults';
import { FeatureFlagResolverService } from '../app-config/feature-flag-resolver.service';
import { BusinessSubcategoryService } from '../businesses/business-subcategory.service';
import { SubcategoriesService } from '../categories/subcategories.service';
import { UserAvatarService } from '../users/user-avatar.service';
import { normalizeUserAvatar } from '../../common/utils/avatar-image.util';

describe('Stage 6.8C.1 — subcategories and user avatar', () => {
  describe('Feature flag subcategoriesEnabled (AK–AQ)', () => {
    const resolver = new FeatureFlagResolverService({} as never);

    it('AK: global OFF by default', () => {
      expect(FEATURE_FLAG_SAFE_DEFAULTS.subcategoriesEnabled).toBe(false);
    });

    it('AM/AN: Uralsk override without citySlug hack', () => {
      const flags = [
        {
          key: 'subcategoriesEnabled',
          globalEnabled: false,
          androidEnabled: null,
          iosEnabled: null,
        },
      ];
      const uralsk = resolver.resolve(
        flags,
        [{ flagKey: 'subcategoriesEnabled', enabled: true }],
        undefined,
        'city-uralsk',
      );
      const aktobe = resolver.resolve(flags, [], undefined, 'city-aktobe');
      expect(uralsk.subcategoriesEnabled).toBe(true);
      expect(aktobe.subcategoriesEnabled).toBe(false);
    });
  });

  describe('BusinessSubcategoryService parent validation (L,M)', () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 'sub-pizza', categoryId: 'cat-food', isActive: true },
    ]);
    const prisma = {
      subcategory: { findMany },
      businessSubcategory: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
    } as never;
    const service = new BusinessSubcategoryService(prisma);

    it('L: rejects cross-category subcategory', async () => {
      await expect(
        service.syncForBusiness('biz-1', 'cat-auto', ['sub-pizza']),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('M: rejects inactive subcategory', async () => {
      findMany.mockResolvedValueOnce([
        { id: 'sub-x', categoryId: 'cat-food', isActive: false },
      ]);
      await expect(
        service.syncForBusiness('biz-1', 'cat-food', ['sub-x']),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('SubcategoriesService auth (A,C)', () => {
    it('C: CITY_ADMIN cannot create taxonomy', async () => {
      const service = new SubcategoriesService({} as never, {} as never);
      await expect(
        service.create(
          { id: 'u', sub: 'u', role: UserRole.CITY_ADMIN, phone: '+1' },
          {
            categoryId: 'c1',
            slug: 'test',
            nameRu: 'Test',
            nameKk: 'Test',
          },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('Avatar file validation (AY–BC)', () => {
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);

    it('BC: SVG rejected', async () => {
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
      await expect(normalizeUserAvatar(svg)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('AY: fake JPEG MIME/content rejected', async () => {
      const fake = Buffer.from('not-an-image-at-all');
      await expect(normalizeUserAvatar(fake)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('AZ: truncated PNG rejected', async () => {
      await expect(normalizeUserAvatar(pngHeader)).rejects.toThrow();
    });
  });

  describe('UserAvatarService ownership (AU,AW)', () => {
    it('AW: upload uses session userId only', async () => {
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue({ avatarUrl: null }),
          update: jest.fn(),
        },
      };
      const rateLimits = {
        assertAllowed: jest.fn(),
        recordHit: jest.fn(),
      };
      const config = { get: jest.fn().mockReturnValue('./uploads-test') };
      const service = new UserAvatarService(prisma as never, config as never, rateLimits as never);
      await expect(
        service.uploadAvatar('user-a', undefined as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
