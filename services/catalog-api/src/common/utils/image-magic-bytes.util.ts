export type DetectedImageFormat = 'jpeg' | 'png' | 'webp' | 'gif';

const MAX_PIXELS = 25_000_000;

export function detectImageFormat(buffer: Buffer): DetectedImageFormat | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return 'gif';
  }

  return null;
}

export function extensionForFormat(format: DetectedImageFormat): string {
  switch (format) {
    case 'jpeg':
      return '.jpg';
    case 'png':
      return '.png';
    case 'webp':
      return '.webp';
    case 'gif':
      return '.gif';
  }
}

export function mimeForFormat(format: DetectedImageFormat): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
  }
}

/** Lightweight dimension bounds without full decode (PNG/JPEG/GIF/WebP headers). */
export function assertReasonableImageDimensions(
  buffer: Buffer,
  format: DetectedImageFormat,
): void {
  let width = 0;
  let height = 0;

  if (format === 'png' && buffer.length >= 24) {
    width = buffer.readUInt32BE(16);
    height = buffer.readUInt32BE(20);
  } else if (format === 'gif' && buffer.length >= 10) {
    width = buffer.readUInt16LE(6);
    height = buffer.readUInt16LE(8);
  } else if (format === 'webp' && buffer.length >= 30) {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') {
      width = buffer.readUInt16LE(26) & 0x3fff;
      height = buffer.readUInt16LE(28) & 0x3fff;
    } else if (chunk === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      width = (bits & 0x3fff) + 1;
      height = ((bits >> 14) & 0x3fff) + 1;
    } else if (chunk === 'VP8X' && buffer.length >= 30) {
      width = 1 + buffer.readUIntLE(24, 3);
      height = 1 + buffer.readUIntLE(27, 3);
    }
  } else if (format === 'jpeg') {
    let i = 2;
    while (i + 9 < buffer.length) {
      if (buffer[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buffer[i + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        height = buffer.readUInt16BE(i + 5);
        width = buffer.readUInt16BE(i + 7);
        break;
      }
      const len = buffer.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }

  if (width > 0 && height > 0) {
    if (width > 16_384 || height > 16_384) {
      throw new Error('IMAGE_DIMENSIONS_TOO_LARGE');
    }
    if (width * height > MAX_PIXELS) {
      throw new Error('IMAGE_PIXEL_COUNT_TOO_LARGE');
    }
  }
}
