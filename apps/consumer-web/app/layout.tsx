import type { Metadata } from 'next';
import './globals.css';
import { siteMetadataForLocale } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const { title, description } = siteMetadataForLocale(locale);
  return { title, description };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
