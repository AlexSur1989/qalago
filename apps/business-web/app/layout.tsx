import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { LocaleProvider } from '@/components/locale-provider';
import { PlatformFeaturesProvider } from '@/components/platform-features-provider';
import { BackofficeProviders } from '@/components/backoffice-providers';
import { siteMetadataForLocale } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const { title, description } = siteMetadataForLocale(locale);
  return { title, description };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} className={montserrat.variable}>
      <body className={montserrat.className}>
        <LocaleProvider initialLocale={locale}>
          <PlatformFeaturesProvider>
            <BackofficeProviders>{children}</BackofficeProviders>
          </PlatformFeaturesProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
