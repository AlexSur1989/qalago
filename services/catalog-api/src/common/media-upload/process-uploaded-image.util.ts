import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { detectImageFormat } from '../utils/image-magic-bytes.util';
import { MediaUploadErrorCode, mediaUploadBadRequest } from './media-upload.errors';

export type ProcessedImage = {
  data: Buffer;
  ext: '.webp';
  width: number;
  height: number;
};

export type ImageUploadPolicy = {
  maxInputBytes: number;
  maxWidth: number;
  maxHeight: number;
  maxPixels: number;
  /** Fit inside box; avatar uses fixed square outputSize instead when set. */
  outputMaxSide?: number;
  outputSize?: number;
  quality: number;
};

export const ImageUploadPolicyPreset = {
  BUSINESS: {
    maxInputBytes: 5 * 1024 * 1024,
    maxWidth: 4096,
    maxHeight: 4096,
    maxPixels: 16_000_000,
    outputMaxSide: 4096,
    quality: 85,
  },
  AVATAR: {
    maxInputBytes: 5 * 1024 * 1024,
    maxWidth: 4096,
    maxHeight: 4096,
    maxPixels: 16_000_000,
    outputSize: 512,
    quality: 85,
  },
  CATEGORY_ICON: {
    maxInputBytes: 2 * 1024 * 1024,
    maxWidth: 512,
    maxHeight: 512,
    maxPixels: 512 * 512,
    outputMaxSide: 256,
    quality: 85,
  },
} as const satisfies Record<string, ImageUploadPolicy>;

export async function processUploadedImage(
  buffer: Buffer,
  policy: ImageUploadPolicy,
): Promise<ProcessedImage> {
  if (!buffer?.length) {
    throw mediaUploadBadRequest(MediaUploadErrorCode.INVALID_IMAGE_DATA, 'File required');
  }
  if (buffer.length > policy.maxInputBytes) {
    throw mediaUploadBadRequest(MediaUploadErrorCode.IMAGE_TOO_LARGE, 'File too large');
  }

  const format = detectImageFormat(buffer);
  if (!format || format === 'gif') {
    throw mediaUploadBadRequest(
      MediaUploadErrorCode.INVALID_IMAGE_TYPE,
      'Unsupported or invalid image content',
    );
  }

  try {
    const probe = sharp(buffer, { animated: false, failOn: 'error' });
    const meta = await probe.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) {
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.INVALID_IMAGE_DATA,
        'Unsupported or invalid image content',
      );
    }
    if (meta.pages && meta.pages > 1) {
      throw mediaUploadBadRequest(MediaUploadErrorCode.INVALID_IMAGE_TYPE, 'Unsupported or invalid image content');
    }
    if (width > policy.maxWidth || height > policy.maxHeight) {
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.IMAGE_DIMENSIONS_TOO_LARGE,
        'Image dimensions too large',
      );
    }
    if (width * height > policy.maxPixels) {
      throw mediaUploadBadRequest(
        MediaUploadErrorCode.IMAGE_DIMENSIONS_TOO_LARGE,
        'Image dimensions too large',
      );
    }

    let pipeline = sharp(buffer, { animated: false, failOn: 'error' }).rotate();
    if (policy.outputSize) {
      pipeline = pipeline.resize(policy.outputSize, policy.outputSize, {
        fit: 'cover',
        position: 'centre',
      });
    } else if (policy.outputMaxSide) {
      pipeline = pipeline.resize(policy.outputMaxSide, policy.outputMaxSide, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const data = await pipeline.webp({ quality: policy.quality }).toBuffer();
    const outMeta = await sharp(data).metadata();
    return {
      data,
      ext: '.webp',
      width: outMeta.width ?? width,
      height: outMeta.height ?? height,
    };
  } catch (e) {
    if (e instanceof BadRequestException) {
      throw e;
    }
    throw mediaUploadBadRequest(
      MediaUploadErrorCode.IMAGE_PROCESSING_FAILED,
      'Unsupported or invalid image content',
    );
  }
}
