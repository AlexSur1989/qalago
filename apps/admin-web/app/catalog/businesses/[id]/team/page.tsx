'use client';

import { useParams } from 'next/navigation';
import { CatalogBusinessTeamPanel } from '@/components/catalog/catalog-business-team-panel';
import { AdminBusinessTeamUnavailable } from '@/components/catalog/admin-business-team-unavailable';
import { useCatalogContext } from '@/components/catalog/catalog-layout-client';
import { adminBusinessTeamEnabled } from '@/lib/admin-feature-flags';
import { adminCatalogLabel } from '@/lib/admin-catalog-labels';
import Link from 'next/link';

export default function CatalogBusinessTeamPage() {
  const params = useParams<{ id: string }>();
  const { locale } = useCatalogContext();
  const businessId = params.id;

  if (!adminBusinessTeamEnabled()) {
    return <AdminBusinessTeamUnavailable locale={locale} businessId={businessId} />;
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0 }}>{adminCatalogLabel(locale, 'pageTeamTitle')}</h1>
        <Link href={`/catalog/businesses/${businessId}`} className="btn btn-ghost btn-sm">
          ← {adminCatalogLabel(locale, 'pageDetailTitle')}
        </Link>
      </div>
      <CatalogBusinessTeamPanel businessId={businessId} locale={locale} />
    </section>
  );
}
