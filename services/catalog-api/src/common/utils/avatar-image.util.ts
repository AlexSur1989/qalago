import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import {
  assertReasonableImageDimensions,
  detectImageFormat,
  extensionForFormat,
} from './image-magic-bytes.util';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_OUTPUT_SIZE = 512;

export async function normalizeUserAvatar(buffer: Buffer): Promise<{ data: Buffer; ext: string }> {
  if (buffer.length > AVATAR_MAX_BYTES) {
    throw new BadRequestException('File too large');
  }
  const format = detectImageFormat(buffer);
  if (!format || format === 'gif') {
    throw new BadRequestException('Unsupported or invalid image content');
  }
  try {
    assertReasonableImageDimensions(buffer, format);
  } catch {
    throw new BadRequestException('Image dimensions too large');
  }

  const data = await sharp(buffer)
    .rotate()
    .resize(AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE, {
      fit: 'cover',
      position: 'centre',
    })
    .webp({ quality: 85 })
    .toBuffer();

  return { data, ext: '.webp' };
}

export { AVATAR_MAX_BYTES, AVATAR_OUTPUT_SIZE };
