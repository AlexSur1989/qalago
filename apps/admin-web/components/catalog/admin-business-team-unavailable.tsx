'use client';

import Link from 'next/link';
import { adminCatalogLabel, type AdminCatalogLocale } from '@/lib/admin-catalog-labels';

export function AdminBusinessTeamUnavailable({ locale, businessId }: { locale: AdminCatalogLocale; businessId: string }) {
  return (
    <div className="empty-state" style={{ maxWidth: 480 }}>
      <h2>{adminCatalogLabel(locale, 'teamFeatureUnavailableTitle')}</h2>
      <p className="muted">{adminCatalogLabel(locale, 'teamFeatureUnavailableHint')}</p>
      <Link href={`/catalog/businesses/${businessId}`} className="btn btn-primary" style={{ marginTop: 16 }}>
        {adminCatalogLabel(locale, 'openDetail')}
      </Link>
    </div>
  );
}
