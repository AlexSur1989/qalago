/**
 * Consumer Web public origin for F.7 legal redirects (aligned with apps/consumer-web getConsumerWebOrigin).
 */
export function normalizeConsumerWebOrigin(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'http://localhost:3005';
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
    throw new Error('Unsafe origin protocol');
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withScheme);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Unsafe origin protocol');
  }
  return `${url.protocol}//${url.host}`;
}

export function getConsumerWebOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_CONSUMER_WEB_URL ??
    'http://localhost:3005';
  return normalizeConsumerWebOrigin(raw);
}
