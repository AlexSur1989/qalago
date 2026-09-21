import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { PublicShell } from '@/components/PublicShell';
import { fetchCities } from '@/lib/catalog-api';
import { siteMetadataForLocale } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
});

/** Must be a literal for Next.js segment config (see lib/cache-policy.ts). */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const { title, description } = siteMetadataForLocale(locale);
  return { title, description };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  const cities = await fetchCities().catch(() => []);
  return (
    <html lang={locale} className={montserrat.variable}>
      <body className={montserrat.className}>
        <PublicShell locale={locale} cities={cities}>
          {children}
        </PublicShell>
      </body>
    </html>
  );
}
