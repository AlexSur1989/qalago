import { notFound } from 'next/navigation';
import { isSupportedPublicLocale } from '@/lib/public-locale';

export default async function PublicLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedPublicLocale(locale)) notFound();
  return children;
}

export function generateStaticParams() {
  return [{ locale: 'ru' }, { locale: 'kk' }];
}
