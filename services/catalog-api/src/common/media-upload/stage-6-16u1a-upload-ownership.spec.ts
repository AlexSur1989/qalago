import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import sharp from 'sharp';
import { UploadsService } from '../../modules/uploads/uploads.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createTestUploadReceiptService } from '../../test-utils/mock-upload-receipt';
import { MediaUploadErrorCode } from './media-upload.errors';
import { UploadReceiptService } from './upload-receipt.service';
import {
  ImageUploadPolicyPreset,
  processUploadedImage,
} from './process-uploaded-image.util';
import { assertAttachableLocalUploadPath } from './trusted-media-url.util';

describe('Stage 6.16U.1A — upload ownership', () => {
  const businessA = 'biz-a';
  const businessB = 'biz-b';
  const urlA = '/uploads/550e8400-e29b-41d4-a716-4466554400a1.webp';
  let uploadDir: string;
  let receiptService: UploadReceiptService;

  beforeEach(() => {
    uploadDir = mkdtempSync(join(tmpdir(), 'qalago-u1a-'));
    writeFileSync(join(uploadDir, '550e8400-e29b-41d4-a716-4466554400a1.webp'), 'webp');
    receiptService = createTestUploadReceiptService();
  });

  afterEach(() => {
    rmSync(uploadDir, { recursive: true, force: true });
  });

  function buildService(ownerId = 'owner-b') {
    return new UploadsService(
      { get: jest.fn().mockReturnValue(uploadDir) } as never,
      {
        businessImage: {
          create: jest.fn().mockResolvedValue({ id: 'img-1', businessId: businessA, imageUrl: urlA }),
          count: jest.fn().mockResolvedValue(0),
        },
        business: { findUnique: jest.fn().mockResolvedValue({ coverImageUrl: null }), count: jest.fn().mockResolvedValue(0) },
        serviceItem: { count: jest.fn().mockResolvedValue(0) },
        adCreative: { count: jest.fn().mockResolvedValue(0) },
        category: { count: jest.fn().mockResolvedValue(0) },
        subcategory: { count: jest.fn().mockResolvedValue(0) },
        user: { count: jest.fn().mockResolvedValue(0) },
        promotion: { count: jest.fn().mockResolvedValue(0) },
        businessLocation: { findFirst: jest.fn() },
      } as never,
      { assertCanAddPhoto: jest.fn().mockResolvedValue(undefined) } as never,
      asBusinessAccessService(createMockBusinessAccess({ ownerId })),
      asAuditLogService(createMockAuditLog()),
      {
        assertAllowed: jest.fn().mockResolvedValue(undefined),
        recordHit: jest.fn().mockResolvedValue(undefined),
      } as never,
      receiptService,
    );
  }

  it('UPLOAD-013: Business B cannot attach Business A canonical URL without receipt', async () => {
    const ownerB = { id: 'owner-b', sub: 'owner-b', role: UserRole.BUSINESS, phone: '+2' };
    const svc = buildService('owner-b');
    await expect(svc.attachToBusiness(ownerB, businessB, urlA)).rejects.toMatchObject({
      response: { code: MediaUploadErrorCode.UPLOAD_RECEIPT_REQUIRED },
    });
  });

  it('UPLOAD-013: Business B cannot attach with Business A upload receipt', async () => {
    const ownerA = { id: 'owner-a', sub: 'owner-a', role: UserRole.BUSINESS, phone: '+1' };
    const ownerB = { id: 'owner-b', sub: 'owner-b', role: UserRole.BUSINESS, phone: '+2' };
    const tokenForA = receiptService.createReceipt(ownerA, urlA, {
      kind: 'business',
      businessId: businessA,
    });
    const svc = buildService('owner-b');
    await expect(
      svc.attachToBusiness(ownerB, businessB, urlA, { uploadToken: tokenForA }),
    ).rejects.toMatchObject({
      response: { code: MediaUploadErrorCode.UPLOAD_RECEIPT_INVALID },
    });
  });

  it('rejects replay of consumed upload receipt', async () => {
    const ownerA = { id: 'owner-a', sub: 'owner-a', role: UserRole.BUSINESS, phone: '+1' };
    const token = receiptService.createReceipt(ownerA, urlA, {
      kind: 'business',
      businessId: businessA,
    });
    const svc = buildService('owner-a');
    await svc.attachToBusiness(ownerA, businessA, urlA, { uploadToken: token });
    await expect(
      svc.attachToBusiness(ownerA, businessA, urlA, { uploadToken: token }),
    ).rejects.toMatchObject({
      response: { code: MediaUploadErrorCode.UPLOAD_RECEIPT_INVALID },
    });
  });

  it('rejects traversal-like attach paths', () => {
    expect(() => assertAttachableLocalUploadPath('/uploads/../etc/passwd')).toThrow(
      BadRequestException,
    );
  });

  describe('processing matrix (extended)', () => {
    it('rejects malformed JPEG', async () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x00]);
      await expect(processUploadedImage(buf, ImageUploadPolicyPreset.BUSINESS)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects malformed PNG', async () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
      await expect(processUploadedImage(buf, ImageUploadPolicyPreset.BUSINESS)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects malformed WebP', async () => {
      const buf = Buffer.from('RIFFxxxxWEBP');
      await expect(processUploadedImage(buf, ImageUploadPolicyPreset.BUSINESS)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects excessive decoded dimensions', async () => {
      const wide = await sharp({
        create: {
          width: ImageUploadPolicyPreset.BUSINESS.maxWidth + 1,
          height: 8,
          channels: 3,
          background: '#000',
        },
      })
        .jpeg()
        .toBuffer();
      await expect(processUploadedImage(wide, ImageUploadPolicyPreset.BUSINESS)).rejects.toMatchObject({
        response: { code: MediaUploadErrorCode.IMAGE_DIMENSIONS_TOO_LARGE },
      });
    });

    it('normalizes valid WebP input', async () => {
      const webp = await sharp({
        create: { width: 24, height: 24, channels: 3, background: '#fff' },
      })
        .webp()
        .toBuffer();
      const out = await processUploadedImage(webp, ImageUploadPolicyPreset.BUSINESS);
      expect(out.ext).toBe('.webp');
    });
  });
});
