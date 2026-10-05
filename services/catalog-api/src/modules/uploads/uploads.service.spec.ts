import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessPermission, UserRole } from '@prisma/client';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { UploadsService } from './uploads.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createTestUploadReceiptService } from '../../test-utils/mock-upload-receipt';
import { AuthUser } from '../../common/types/jwt-payload.type';

const TRUSTED_URL = '/uploads/550e8400-e29b-41d4-a716-446655440000.webp';

describe('UploadsService authorization', () => {
  const businessId = 'biz-1';
  let businessAccess: ReturnType<typeof createMockBusinessAccess>;
  let service: UploadsService;
  let uploadDir: string;
  let uploadReceipts: ReturnType<typeof createTestUploadReceiptService>;

  beforeEach(() => {
    businessAccess = createMockBusinessAccess();
    uploadDir = mkdtempSync(join(tmpdir(), 'qalago-upload-spec-'));
    writeFileSync(join(uploadDir, '550e8400-e29b-41d4-a716-446655440000.webp'), 'webp');
    uploadReceipts = createTestUploadReceiptService();

    service = new UploadsService(
      { get: jest.fn().mockReturnValue(uploadDir) } as never,
      {
        businessImage: {
          create: jest.fn().mockResolvedValue({ id: 'img-1', businessId, imageUrl: TRUSTED_URL }),
          findMany: jest.fn(),
        },
        business: {
          findUnique: jest.fn().mockResolvedValue({ coverImageUrl: null }),
        },
      } as never,
      { assertCanAddPhoto: jest.fn().mockResolvedValue(undefined) } as never,
      asBusinessAccessService(businessAccess),
      asAuditLogService(createMockAuditLog()),
      {
        assertAllowed: jest.fn().mockResolvedValue(undefined),
        recordHit: jest.fn().mockResolvedValue(undefined),
      } as never,
      uploadReceipts,
    );
  });

  function receiptFor(user: AuthUser, url: string) {
    return uploadReceipts.createReceipt(user, url, { kind: 'business', businessId });
  }

  afterEach(() => {
    rmSync(uploadDir, { recursive: true, force: true });
  });

  it('delegates attach authorization to BusinessAccessService PHOTOS_EDIT', async () => {
    const user = { id: 'owner-1', sub: 'owner-1', role: UserRole.BUSINESS, phone: '+1' };
    await service.attachToBusiness(user, businessId, TRUSTED_URL, {
      uploadToken: receiptFor(user, TRUSTED_URL),
    });
    expect(businessAccess.assertBusinessPermission).toHaveBeenCalledWith(
      user,
      businessId,
      BusinessPermission.PHOTOS_EDIT,
    );
  });

  it('propagates forbidden from BusinessAccessService', async () => {
    businessAccess.assertBusinessPermission.mockRejectedValue(
      new ForbiddenException('Not allowed to manage this business'),
    );
    const user = { id: 'owner-x', sub: 'owner-x', role: UserRole.BUSINESS, phone: '+2' };
    await expect(
      service.attachToBusiness(user, businessId, TRUSTED_URL),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects attach with untrusted external URL', async () => {
    const user = { id: 'owner-1', sub: 'owner-1', role: UserRole.BUSINESS, phone: '+1' };
    await expect(
      service.attachToBusiness(user, businessId, 'https://cdn/x.jpg'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deleteBusinessImage requires image under same businessId', async () => {
    const prisma = {
      businessImage: {
        findFirst: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
      },
      business: { findUnique: jest.fn() },
    };
    const svc = new UploadsService(
      { get: jest.fn().mockReturnValue('./uploads') } as never,
      prisma as never,
      { assertCanAddPhoto: jest.fn() } as never,
      asBusinessAccessService(businessAccess),
      asAuditLogService(createMockAuditLog()),
      {
        assertAllowed: jest.fn().mockResolvedValue(undefined),
        recordHit: jest.fn().mockResolvedValue(undefined),
      } as never,
      uploadReceipts,
    );
    const user = { id: 'owner-1', sub: 'owner-1', role: UserRole.BUSINESS, phone: '+1' };
    await expect(svc.deleteBusinessImage(user, businessId, 'img-other-biz')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.businessImage.delete).not.toHaveBeenCalled();
  });

  it('propagates not found from BusinessAccessService', async () => {
    businessAccess.assertBusinessPermission.mockRejectedValue(
      new NotFoundException('Business not found'),
    );
    const user = { id: 'admin', sub: 'admin', role: UserRole.ADMIN, phone: '+3' };
    await expect(service.listBusinessImages(user, businessId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
