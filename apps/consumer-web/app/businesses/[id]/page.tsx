import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cachedFetchBusiness, cachedFetchPublicBusinessLocations } from '@/lib/catalog-cache';
import { BusinessBranchesSection } from '@/components/BusinessBranchesSection';
import { getApiOrigin } from '@/lib/public-config';
import { UI_LABELS } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import { metadataForTemporaryBusinessDetail } from '@/lib/seo/page-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const business = await cachedFetchBusiness(id);
  if (!business) notFound();
  return metadataForTemporaryBusinessDetail(business.title);
}

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const business = await cachedFetchBusiness(id);
  if (!business) notFound();
  const branches = await cachedFetchPublicBusinessLocations(id);
  const apiOrigin = getApiOrigin();
  const cover = business.coverImageUrl
    ? business.coverImageUrl.startsWith('http')
      ? business.coverImageUrl
      : `${apiOrigin}${business.coverImageUrl}`
    : null;

  return (
    <main className="page">
      <Link href="/categories" className="page-back">
        {labels.allCategories}
      </Link>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={labels.businessCoverAlt}
          width={320}
          height={180}
          style={{ borderRadius: 16, objectFit: 'cover', maxWidth: '100%' }}
        />
      ) : null}
      <h1 className="page-title" style={{ marginTop: 16 }}>
        {business.title}
      </h1>
      <p style={{ color: 'var(--muted)' }}>{business.address}</p>
      {business.shortDesc ? <p>{business.shortDesc}</p> : null}
      <BusinessBranchesSection
        locale={locale}
        branches={branches}
        labels={{
          branchesTitle: labels.businessBranchesTitle,
          primaryBadge: labels.businessPrimaryBranchBadge,
        }}
      />
    </main>
  );
}
