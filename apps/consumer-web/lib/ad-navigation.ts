import { canonicalBusinessPagePath } from './business-page-paths';
import type { AdServeItemDto } from './ads-types';
import type { PublicLocale } from './public-locale';

export function adResolvedLocationId(item: AdServeItemDto): string | undefined {
  const dest = item.destinationLocationId?.trim();
  if (dest) return dest;
  const ctx = item.contextLocationId?.trim();
  return ctx || undefined;
}

export function adBusinessHref(
  locale: PublicLocale,
  citySlug: string,
  item: AdServeItemDto,
): string | null {
  const slug = item.business?.slug?.trim();
  if (!slug) return null;
  return canonicalBusinessPagePath(
    locale,
    citySlug,
    slug,
    adResolvedLocationId(item),
  );
}

export function adExternalUrl(item: AdServeItemDto): string | null {
  const url = item.creative?.targetUrl?.trim();
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

export function vipBannerNavigateTarget(
  locale: PublicLocale,
  citySlug: string,
  item: AdServeItemDto,
): { kind: 'href'; href: string } | { kind: 'external'; url: string } | null {
  const creative = item.creative;
  if (!creative) return null;
  const targetType = creative.targetType ?? 'BUSINESS';
  if (targetType === 'EXTERNAL_URL') {
    const url = adExternalUrl(item);
    return url ? { kind: 'external', url } : null;
  }
  const href = adBusinessHref(locale, citySlug, item);
  return href ? { kind: 'href', href } : null;
}
