import { localUploadFileExists } from './local-upload-storage.util';
import { MediaUploadErrorCode, mediaUploadBadRequest } from './media-upload.errors';

/** New writes must use normalized WebP uploads. */
const NEW_WRITE_PATH =
  /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i;

/** Attach may reference pre-hardening local blobs still on disk. */
const LEGACY_LOCAL_PATH =
  /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|jpe?g|png)$/i;

const BLOCKED_SCHEME = /^(javascript:|data:|blob:|file:)/i;

export function isBlockedMediaUrlScheme(url: string): boolean {
  const trimmed = url.trim();
  return BLOCKED_SCHEME.test(trimmed.toLowerCase());
}

export function isTrustedMediaUrlForWrite(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || isBlockedMediaUrlScheme(trimmed)) return false;
  if (trimmed.includes('..') || trimmed.includes('\\')) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  return NEW_WRITE_PATH.test(trimmed);
}

export function isLegacyLocalUploadPath(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || isBlockedMediaUrlScheme(trimmed)) return false;
  if (trimmed.includes('..') || trimmed.includes('\\')) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  return LEGACY_LOCAL_PATH.test(trimmed) || NEW_WRITE_PATH.test(trimmed);
}

export function assertTrustedMediaUrlForWrite(url: string | null | undefined): void {
  if (url == null || url === '') return;
  if (!isTrustedMediaUrlForWrite(url)) {
    throw mediaUploadBadRequest(
      MediaUploadErrorCode.UNTRUSTED_MEDIA_URL,
      'Untrusted media URL',
    );
  }
}

export function assertAttachableLocalUploadPath(url: string): void {
  if (!isLegacyLocalUploadPath(url)) {
    throw mediaUploadBadRequest(
      MediaUploadErrorCode.UNTRUSTED_MEDIA_URL,
      'Untrusted media URL',
    );
  }
}

export function assertTrustedMediaUrlWriteWithLocalFile(
  uploadDir: string,
  url: string | undefined | null,
): void {
  if (url == null || url === '') return;
  assertTrustedMediaUrlForWrite(url);
  if (!localUploadFileExists(uploadDir, url)) {
    throw mediaUploadBadRequest(MediaUploadErrorCode.UPLOAD_NOT_FOUND, 'Upload not found');
  }
}

export function extractUploadFilenameFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!isLegacyLocalUploadPath(trimmed)) return null;
  const base = trimmed.replace(/^\/uploads\//, '');
  if (base.includes('/') || base.includes('..') || base.includes('\\')) return null;
  return base;
}
