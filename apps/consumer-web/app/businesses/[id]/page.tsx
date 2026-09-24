import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cachedFetchBusiness, cachedFetchPublicBusinessLocations } from '@/lib/catalog-cache';
import {
  detailPhysicalAddress,
  detailPhysicalContacts,
  activeLocationIdFromDetail,
} from '@/lib/business-detail-display';
import { BusinessBranchesSection } from '@/components/BusinessBranchesSection';
import { getApiOrigin } from '@/lib/public-config';
import { UI_LABELS } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import { metadataForTemporaryBusinessDetail } from '@/lib/seo/page-metadata';

function parseLocationIdParam(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value == null || value.trim() === '') return undefined;
  return value.trim();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locationId?: string | string[] }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { locationId: locationIdRaw } = await searchParams;
  const locationId = parseLocationIdParam(locationIdRaw);
  const business = await cachedFetchBusiness(id, locationId);
  if (!business) notFound();
  return metadataForTemporaryBusinessDetail(business.title);
}

export default async function BusinessDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locationId?: string | string[] }>;
}) {
  const { id } = await params;
  const { locationId: locationIdRaw } = await searchParams;
  const locationId = parseLocationIdParam(locationIdRaw);
  const locale = await getServerLocale();
  const labels = UI_LABELS[locale];
  const business = await cachedFetchBusiness(id, locationId);
  if (!business) notFound();
  const branches = await cachedFetchPublicBusinessLocations(id);
  const activeLocationId = activeLocationIdFromDetail(business, locationId);
  const address = detailPhysicalAddress(business);
  const contacts = detailPhysicalContacts(business);
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
      <p style={{ color: 'var(--muted)' }}>{address}</p>
      {contacts.phone ? (
        <p style={{ fontSize: 14, marginTop: 8 }}>{contacts.phone}</p>
      ) : null}
      {contacts.whatsapp ? (
        <p style={{ fontSize: 14, marginTop: 4 }}>{contacts.whatsapp}</p>
      ) : null}
      {contacts.website ? (
        <p style={{ fontSize: 14, marginTop: 4 }}>
          <a href={contacts.website} rel="noopener noreferrer">
            {contacts.website}
          </a>
        </p>
      ) : null}
      {business.shortDesc ? <p style={{ marginTop: 12 }}>{business.shortDesc}</p> : null}
      <BusinessBranchesSection
        locale={locale}
        businessId={id}
        branches={branches}
        activeLocationId={activeLocationId}
        labels={{
          branchesTitle: labels.businessBranchesTitle,
          primaryBadge: labels.businessPrimaryBranchBadge,
        }}
      />
    </main>
  );
}
