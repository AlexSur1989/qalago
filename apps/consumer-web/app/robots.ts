import type { MetadataRoute } from 'next';
import { getConsumerWebOrigin } from '@/lib/seo/canonical';

export default function robots(): MetadataRoute.Robots {
  const origin = getConsumerWebOrigin();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/businesses/'],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
