import { BadRequestException } from '@nestjs/common';
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import sharp from 'sharp';
import {
  ImageUploadPolicyPreset,
  processUploadedImage,
} from './process-uploaded-image.util';
import {
  assertAttachableLocalUploadPath,
  assertTrustedMediaUrlForWrite,
  assertTrustedMediaUrlWriteWithLocalFile,
  isTrustedMediaUrlForWrite,
} from './trusted-media-url.util';
import { MediaUploadErrorCode } from './media-upload.errors';
import { localUploadFileExists } from './local-upload-storage.util';
import { countMediaUrlReferences } from './media-url-reference.util';

describe('Stage 6.16U.1 — media upload security', () => {
  describe('processUploadedImage', () => {
    it('rejects fake JPEG magic content', async () => {
      const buf = Buffer.from('not-an-image');
      await expect(processUploadedImage(buf, ImageUploadPolicyPreset.BUSINESS)).rejects.toMatchObject({
        response: { code: MediaUploadErrorCode.INVALID_IMAGE_TYPE },
      });
    });

    it('rejects SVG', async () => {
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
      await expect(processUploadedImage(svg, ImageUploadPolicyPreset.BUSINESS)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects GIF signature', async () => {
      const gif = Buffer.from('GIF89a\x00\x00\x00\x00\x00\x00', 'binary');
      await expect(processUploadedImage(gif, ImageUploadPolicyPreset.BUSINESS)).rejects.toMatchObject({
        response: { code: MediaUploadErrorCode.INVALID_IMAGE_TYPE },
      });
    });

    it('rejects oversized input', async () => {
      const buf = Buffer.alloc(ImageUploadPolicyPreset.BUSINESS.maxInputBytes + 1);
      await expect(processUploadedImage(buf, ImageUploadPolicyPreset.BUSINESS)).rejects.toMatchObject({
        response: { code: MediaUploadErrorCode.IMAGE_TOO_LARGE },
      });
    });

    it('normalizes valid JPEG to WebP', async () => {
      const jpeg = await sharp({
        create: { width: 64, height: 64, channels: 3, background: '#336699' },
      })
        .jpeg()
        .toBuffer();
      const out = await processUploadedImage(jpeg, ImageUploadPolicyPreset.BUSINESS);
      expect(out.ext).toBe('.webp');
      expect(out.data.subarray(0, 4).toString()).not.toBe('\xff\xd8\xff');
    });

    it('outputs WebP bytes (metadata stripped via re-encode)', async () => {
      const jpeg = await sharp({
        create: { width: 32, height: 32, channels: 3, background: '#000000' },
      })
        .jpeg()
        .toBuffer();
      const out = await processUploadedImage(jpeg, ImageUploadPolicyPreset.BUSINESS);
      const meta = await sharp(out.data).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.exif).toBeUndefined();
    });
  });

  describe('trusted media URLs', () => {
    const sample =
      '/uploads/550e8400-e29b-41d4-a716-446655440000.webp';

    it('accepts canonical webp path for write', () => {
      expect(isTrustedMediaUrlForWrite(sample)).toBe(true);
    });

    it('rejects arbitrary https URL', () => {
      expect(() =>
        assertTrustedMediaUrlForWrite('https://evil.example/x.webp'),
      ).toThrow(BadRequestException);
    });

    it('rejects data: URL', () => {
      expect(() => assertTrustedMediaUrlForWrite('data:image/png;base64,abc')).toThrow(
        BadRequestException,
      );
    });

    it('rejects javascript: URL', () => {
      expect(() => assertTrustedMediaUrlForWrite('javascript:alert(1)')).toThrow(
        BadRequestException,
      );
    });

    it('allows legacy local path for attach syntax', () => {
      expect(() =>
        assertAttachableLocalUploadPath('/uploads/550e8400-e29b-41d4-a716-446655440000.jpg'),
      ).not.toThrow();
    });

    it('requires file exists for trusted write with local file', () => {
      const dir = mkdtempSync(join(tmpdir(), 'qalago-upload-test-'));
      try {
        const url = sample;
        expect(() => assertTrustedMediaUrlWriteWithLocalFile(dir, url)).toThrow(BadRequestException);
        writeFileSync(join(dir, '550e8400-e29b-41d4-a716-446655440000.webp'), 'x');
        expect(localUploadFileExists(dir, url)).toBe(true);
        expect(() => assertTrustedMediaUrlWriteWithLocalFile(dir, url)).not.toThrow();
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('reference counting', () => {
    it('countMediaUrlReferences aggregates prisma counts', async () => {
      const db = {
        businessImage: { count: jest.fn().mockResolvedValue(1) },
        business: { count: jest.fn().mockResolvedValue(0) },
        serviceItem: { count: jest.fn().mockResolvedValue(0) },
        adCreative: { count: jest.fn().mockResolvedValue(0) },
        category: { count: jest.fn().mockResolvedValue(0) },
        subcategory: { count: jest.fn().mockResolvedValue(0) },
        user: { count: jest.fn().mockResolvedValue(0) },
        promotion: { count: jest.fn().mockResolvedValue(0) },
      };
      const total = await countMediaUrlReferences(db as never, '/uploads/x.webp');
      expect(total).toBe(1);
    });
  });
});
