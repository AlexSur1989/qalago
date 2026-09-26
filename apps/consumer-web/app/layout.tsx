import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { JsonLd } from '@/components/JsonLd';
import { PublicShell } from '@/components/PublicShell';
import { cachedFetchCities } from '@/lib/catalog-cache';
import { siteMetadataForLocale } from '@/lib/locale';
import { resolveLayoutLocale } from '@/lib/locale-server';
import { webSiteJsonLd } from '@/lib/seo/json-ld';
import { rootSiteMetadata } from '@/lib/seo/page-metadata';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
});

/** Must be a literal for Next.js segment config (see lib/cache-policy.ts). */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLayoutLocale();
  const { title, description } = siteMetadataForLocale(locale);
  return rootSiteMetadata(locale, title, description);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await resolveLayoutLocale();
  const cities = await cachedFetchCities().catch(() => []);
  return (
    <html lang={locale} className={montserrat.variable}>
      <body className={montserrat.className}>
        <JsonLd data={webSiteJsonLd()} />
        <PublicShell locale={locale} cities={cities}>
          {children}
        </PublicShell>
      </body>
    </html>
  );
}
