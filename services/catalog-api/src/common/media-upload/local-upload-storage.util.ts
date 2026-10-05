import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { extractUploadFilenameFromUrl } from './trusted-media-url.util';

export function resolveSafeUploadFilePath(uploadDir: string, url: string): string | null {
  const filename = extractUploadFilenameFromUrl(url);
  if (!filename) return null;
  return join(uploadDir, filename);
}

export function localUploadFileExists(uploadDir: string, url: string): boolean {
  const filepath = resolveSafeUploadFilePath(uploadDir, url);
  if (!filepath) return false;
  return existsSync(filepath);
}

export function tryUnlinkLocalUploadFile(uploadDir: string, url: string | null | undefined): void {
  if (!url) return;
  const filepath = resolveSafeUploadFilePath(uploadDir, url);
  if (!filepath) return;
  try {
    unlinkSync(filepath);
  } catch {
    /* best-effort */
  }
}
