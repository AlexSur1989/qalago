import { getApiOrigin } from '@/lib/public-config';

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '').toLowerCase();
}

export function trustedMediaOrigins(): Set<string> {
  const api = normalizeOrigin(getApiOrigin());
  const fromEnv = process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL?.trim();
  const consumer = fromEnv ? normalizeOrigin(fromEnv) : '';
  const set = new Set<string>([api]);
  if (consumer) set.add(consumer);
  return set;
}

export function isRelativeUploadsPath(src: string): boolean {
  return src.startsWith('/uploads/');
}

/** Legacy rows may still point at external https URLs — keep rendering, do not use for new writes. */
export function isLegacyExternalMediaUrl(src: string): boolean {
  if (!src.startsWith('http://') && !src.startsWith('https://')) return false;
  try {
    const parsed = new URL(src);
    const origin = normalizeOrigin(`${parsed.protocol}//${parsed.host}`);
    return !trustedMediaOrigins().has(origin);
  } catch {
    return true;
  }
}
