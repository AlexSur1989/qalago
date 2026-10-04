import type { Metadata } from 'next';
import { LegalPackPage } from '@/components/LegalPackPage';
import { getServerLocale } from '@/lib/locale-server';
import { metadataForLegalPage } from '@/lib/seo/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return metadataForLegalPage('privacy', locale);
}

export default function PrivacyPage() {
  return <LegalPackPage packKey="privacy-policy" layoutPage="privacy" />;
}
