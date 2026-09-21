import { getConsumerWebOrigin } from './canonical';

export function serializeJsonLd(data: Record<string, unknown> | unknown[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function webSiteJsonLd(): Record<string, unknown> {
  const origin = getConsumerWebOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'QalaGo',
    url: origin,
  };
}

export type BreadcrumbItem = { name: string; path: string };

export function breadcrumbListJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  const origin = getConsumerWebOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  };
}
