import type { Metadata } from 'next';
import { LegalPackPage } from '@/components/LegalPackPage';
import { getServerLocale } from '@/lib/locale-server';
import { metadataForLegalPage } from '@/lib/seo/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return metadataForLegalPage('terms', locale);
}

export default function TermsPage() {
  return <LegalPackPage packKey="terms-of-use" layoutPage="terms" />;
}
