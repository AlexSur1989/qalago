'use client';

import Link from 'next/link';
import { adminCatalogLabel, type AdminCatalogLocale } from '@/lib/admin-catalog-labels';
import { adminBusinessTeamEnabled } from '@/lib/admin-feature-flags';

type CatalogBusinessTeamPanelProps = {
  businessId: string;
  locale: AdminCatalogLocale;
  /** When true, show link to dedicated team route (detail page). */
  showRouteLink?: boolean;
};

/** Business OWNER→MANAGER admin tools (gated; default off). */
export function CatalogBusinessTeamPanel({
  businessId,
  locale,
  showRouteLink = false,
}: CatalogBusinessTeamPanelProps) {
  if (!adminBusinessTeamEnabled()) return null;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionTeam')}</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        {adminCatalogLabel(locale, 'teamPanelHint')}
      </p>
      {showRouteLink && (
        <Link href={`/catalog/businesses/${businessId}/team`} className="btn btn-sm">
          {adminCatalogLabel(locale, 'linkTeam')}
        </Link>
      )}
    </div>
  );
}
