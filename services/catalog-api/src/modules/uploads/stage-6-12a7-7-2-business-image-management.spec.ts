import { randomBytes } from 'crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import { asBusinessAccessService, createMockBusinessAccess } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { BusinessPublicContentService } from '../businesses/business-public-content.service';
import {
  asReviewAggregationService,
  createMockReviewAggregation,
} from '../../test-utils/mock-review-aggregation';
import { UploadsService } from './uploads.service';
import { createTestUploadReceiptService } from '../../test-utils/mock-upload-receipt';
import { AuthUser } from '../../common/types/jwt-payload.type';

/** Canonical local upload paths (6.16U.1 attach requires UUID + on-disk file). */
const UPLOAD_FIXTURE = {
  shared: '/uploads/550e8400-e29b-41d4-a716-446655440001.webp',
  branch: '/uploads/550e8400-e29b-41d4-a716-446655440002.webp',
  bad: '/uploads/550e8400-e29b-41d4-a716-446655440099.webp',
  cover: '/uploads/550e8400-e29b-41d4-a716-446655440003.webp',
  bonly: '/uploads/550e8400-e29b-41d4-a716-446655440004.webp',
  coverA: '/uploads/550e8400-e29b-41d4-a716-446655440005.webp',
  branchOnly: '/uploads/550e8400-e29b-41d4-a716-446655440006.webp',
  sharedB: '/uploads/550e8400-e29b-41d4-a716-446655440007.webp',
  x: '/uploads/550e8400-e29b-41d4-a716-446655440008.webp',
  listShared: '/uploads/550e8400-e29b-41d4-a716-446655440009.webp',
  listBranch: '/uploads/550e8400-e29b-41d4-a716-44665544000a.webp',
  keep: '/uploads/550e8400-e29b-41d4-a716-44665544000b.webp',
} as const;

describe('Stage 6.12A.7.7.2 — business image scope + public moderation', () => {
  const prisma = new PrismaClient();
  const FIXTURE_OWNER_ID = 'owner-a772';
  let skip = false;
  let cityId = '';
  let categoryId = '';
  let uploadDir = '';
  const receiptService = createTestUploadReceiptService();

  function receiptFor(user: AuthUser, businessId: string, url: string) {
    return receiptService.createReceipt(user, url, { kind: 'business', businessId });
  }

  async function attachWithReceipt(
    svc: UploadsService,
    user: AuthUser,
    businessId: string,
    url: string,
    options: { asCover?: boolean; locationId?: string } = {},
  ) {
    return svc.attachToBusiness(user, businessId, url, {
      ...options,
      uploadToken: receiptFor(user, businessId, url),
    });
  }

  beforeAll(async () => {
    uploadDir = mkdtempSync(join(tmpdir(), 'qalago-a772-upload-'));
    for (const url of Object.values(UPLOAD_FIXTURE)) {
      const name = url.replace(/^\/uploads\//, '');
      writeFileSync(join(uploadDir, name), 'webp-fixture');
    }
    try {
      await prisma.$connect();
      const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      if (!city || !category) skip = true;
      else {
        cityId = city.id;
        categoryId = category.id;
      }
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (uploadDir) rmSync(uploadDir, { recursive: true, force: true });
  });

  function buildUploadsService(
    businessAccess = createMockBusinessAccess({ ownerId: FIXTURE_OWNER_ID }),
  ) {
    return new UploadsService(
      { get: jest.fn().mockReturnValue(uploadDir) } as never,
      prisma as never,
      { assertCanAddPhoto: jest.fn().mockResolvedValue(undefined) } as never,
      asBusinessAccessService(businessAccess),
      asAuditLogService(createMockAuditLog()),
      {
        assertAllowed: jest.fn().mockResolvedValue(undefined),
        recordHit: jest.fn().mockResolvedValue(undefined),
      } as never,
      receiptService,
    );
  }

  async function withBusinessFixture(
    fn: (ctx: {
      businessId: string;
      branchId: string;
      otherBusinessId: string;
      otherBranchId: string;
      user: { id: string; sub: string; role: UserRole; phone: string };
    }) => Promise<void>,
  ) {
    if (skip) return;
    const slugA = `a772-${randomBytes(5).toString('hex')}`;
    const slugB = `a772b-${randomBytes(5).toString('hex')}`;
    const user = {
      id: FIXTURE_OWNER_ID,
      sub: FIXTURE_OWNER_ID,
      role: UserRole.BUSINESS,
      phone: '+7700',
    };
    const a = await prisma.business.create({
      data: {
        title: 'A772',
        slug: slugA,
        categoryId,
        status: 'ACTIVE',
        locations: {
          create: [
            { cityId, address: 'Primary', isPrimary: true },
            { cityId, address: 'Branch', isPrimary: false },
          ],
        },
      },
      include: { locations: true },
    });
    const b = await prisma.business.create({
      data: {
        title: 'A772B',
        slug: slugB,
        categoryId,
        status: 'ACTIVE',
        locations: { create: { cityId, address: 'B1', isPrimary: true } },
      },
      include: { locations: true },
    });
    const branch = a.locations.find((l) => !l.isPrimary)!;
    try {
      await fn({
        businessId: a.id,
        branchId: branch.id,
        otherBusinessId: b.id,
        otherBranchId: b.locations[0]!.id,
        user,
      });
    } finally {
      await prisma.business.deleteMany({ where: { slug: { in: [slugA, slugB] } } });
    }
  }

  it('A — attach shared → locationId null', async () => {
    await withBusinessFixture(async ({ businessId, user }) => {
      const svc = buildUploadsService();
      const row = await attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.shared);
      expect(row.locationId).toBeNull();
    });
  });

  it('B — attach own branch → locationId stored', async () => {
    await withBusinessFixture(async ({ businessId, branchId, user }) => {
      const svc = buildUploadsService();
      const row = await attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.branch, {
        locationId: branchId,
      });
      expect(row.locationId).toBe(branchId);
    });
  });

  it('C — attach foreign branch → rejected', async () => {
    await withBusinessFixture(async ({ businessId, otherBranchId, user }) => {
      const svc = buildUploadsService();
      await expect(
        attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.bad, {
          locationId: otherBranchId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('D — attach nonexistent branch → rejected', async () => {
    await withBusinessFixture(async ({ businessId, user }) => {
      const svc = buildUploadsService();
      await expect(
        attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.bad, {
          locationId: 'does-not-exist',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('E — branch + asCover=true → rejected', async () => {
    await withBusinessFixture(async ({ businessId, branchId, user }) => {
      const svc = buildUploadsService();
      await expect(
        attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.bad, {
          locationId: branchId,
          asCover: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('F — shared + asCover=true → sets Business.coverImageUrl', async () => {
    await withBusinessFixture(async ({ businessId, user }) => {
      const svc = buildUploadsService();
      await attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.cover, { asCover: true });
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { coverImageUrl: true },
      });
      expect(business?.coverImageUrl).toBe(UPLOAD_FIXTURE.cover);
    });
  });

  it('G — set-cover branch image → rejected', async () => {
    await withBusinessFixture(async ({ businessId, branchId, user }) => {
      const svc = buildUploadsService();
      const branch = await attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.bonly, {
        locationId: branchId,
      });
      await expect(svc.setBusinessCover(user, businessId, branch.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  it('H — delete brand cover → replacement shared only', async () => {
    await withBusinessFixture(async ({ businessId, branchId, user }) => {
      const svc = buildUploadsService();
      const cover = await attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.coverA, {
        asCover: true,
      });
      await attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.branchOnly, {
        locationId: branchId,
      });
      const shared2 = await attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.sharedB);
      await svc.deleteBusinessImage(user, businessId, cover.id);
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { coverImageUrl: true },
      });
      expect(business?.coverImageUrl).toBe(UPLOAD_FIXTURE.sharedB);
      expect(business?.coverImageUrl).not.toBe(UPLOAD_FIXTURE.branchOnly);
    });
  });

  it('M — unauthorized attach rejected', async () => {
    await withBusinessFixture(async ({ businessId }) => {
      const denied = createMockBusinessAccess();
      denied.assertBusinessPermission.mockRejectedValue(new ForbiddenException('denied'));
      const svc = buildUploadsService(denied);
      await expect(
        svc.attachToBusiness(
          { id: 'x', sub: 'x', role: UserRole.BUSINESS, phone: '+1' },
          businessId,
          UPLOAD_FIXTURE.x,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  it('management list — all / brand / branch filters', async () => {
    await withBusinessFixture(async ({ businessId, branchId, user }) => {
      const svc = buildUploadsService();
      await attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.listShared);
      await attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.listBranch, {
        locationId: branchId,
      });
      const all = await svc.listBusinessImages(user, businessId, { scope: 'all' });
      expect(all.length).toBeGreaterThanOrEqual(2);
      const brand = await svc.listBusinessImages(user, businessId, { scope: 'brand' });
      expect(brand.every((r) => r.locationId == null)).toBe(true);
      expect(brand.some((r) => r.imageUrl === UPLOAD_FIXTURE.listShared)).toBe(true);
      const branch = await svc.listBusinessImages(user, businessId, { locationId: branchId });
      expect(branch.every((r) => r.locationId === branchId)).toBe(true);
      await expect(
        svc.listBusinessImages(user, businessId, { scope: 'brand', locationId: branchId }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('M — cross-business delete rejected', async () => {
    await withBusinessFixture(async ({ businessId, otherBusinessId, user }) => {
      const svc = buildUploadsService();
      const image = await attachWithReceipt(svc, user, businessId, UPLOAD_FIXTURE.keep);
      await expect(
        svc.deleteBusinessImage(user, otherBusinessId, image.id),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it('I/J — public gallery and photos exclude moderationHidden', async () => {
    if (skip) return;
    const slug = `a772pub-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'Pub',
        slug,
        categoryId,
        status: 'ACTIVE',
        planTier: 'VIP',
        images: {
          create: [
            { imageUrl: '/uploads/v1.jpg', moderationHidden: false },
            { imageUrl: '/uploads/hidden.jpg', moderationHidden: true },
            { imageUrl: '/uploads/v2.jpg', moderationHidden: false },
          ],
        },
      },
    });
    try {
      const planLimits = {
        getBusinessPlanContext: jest.fn().mockResolvedValue({
          effectiveTier: 'VIP',
          limits: { maxPhotos: 100, maxServiceItems: 300, maxActivePromotions: 25 },
        }),
        applyPublicPhotoLimit: jest.fn((items: unknown[], limit: number) =>
          items.slice(0, limit),
        ),
      };
      const publicContent = new BusinessPublicContentService(
        prisma as never,
        planLimits as never,
        asReviewAggregationService(createMockReviewAggregation()),
      );
      const preview = await publicContent.getGalleryPreview(business.id);
      const urls = preview.items.map((i) => i.imageUrl);
      expect(urls).not.toContain('/uploads/hidden.jpg');
      expect(preview.totalCount).toBe(2);

      const page = await publicContent.findPublicPhotos(business.id, { page: 1, limit: 10 });
      expect(page.items.map((i) => i.imageUrl)).not.toContain('/uploads/hidden.jpg');
      expect(page.totalCount).toBe(2);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('L — owner list still returns moderationHidden rows', async () => {
    await withBusinessFixture(async ({ businessId, user }) => {
      const svc = buildUploadsService();
      await prisma.businessImage.create({
        data: {
          businessId,
          imageUrl: '/uploads/hidden-mgmt.jpg',
          moderationHidden: true,
        },
      });
      const rows = await svc.listBusinessImages(user, businessId);
      expect(rows.some((r) => r.moderationHidden)).toBe(true);
    });
  });
});
