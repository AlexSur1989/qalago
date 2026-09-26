import { getApiOrigin } from './public-config';

export function resolvePublicMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith('http')) return url;
  const origin = getApiOrigin();
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function externalMapNavigationUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
}
