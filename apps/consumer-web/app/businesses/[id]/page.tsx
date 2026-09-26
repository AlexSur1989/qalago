import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { parseLocationIdParam } from '@/lib/business-page-paths';
import { cachedFetchBusiness, cachedFetchPublicBusinessLocations } from '@/lib/catalog-cache';
import { metadataForTemporaryBusinessDetail } from '@/lib/seo/page-metadata';
import { resolveLegacyBusinessRedirectPath } from '@/lib/temporary-business-redirect';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const business = await cachedFetchBusiness(id);
  if (!business) {
    return metadataForTemporaryBusinessDetail('QalaGo');
  }
  return metadataForTemporaryBusinessDetail(business.title);
}

export default async function LegacyBusinessDetailRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locationId?: string | string[] }>;
}) {
  const { id } = await params;
  const locationId = parseLocationIdParam((await searchParams).locationId);
  const business = await cachedFetchBusiness(id, locationId);
  if (!business) notFound();

  const branches = await cachedFetchPublicBusinessLocations(id);
  const target = resolveLegacyBusinessRedirectPath(business, branches, locationId);
  if (!target) notFound();

  permanentRedirect(target);
}
