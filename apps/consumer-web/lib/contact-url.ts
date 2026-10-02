/** Normalize public contact targets for href generation (CW.5). */

export function buildTelHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? `tel:${digits}` : `tel:${digits}`;
}

export function buildWhatsAppHref(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export function buildInstagramHref(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  return `https://instagram.com/${handle}`;
}

export function buildWebsiteHref(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}
