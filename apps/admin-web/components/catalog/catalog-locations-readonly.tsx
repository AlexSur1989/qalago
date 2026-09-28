'use client';

import { useEffect, useState } from 'react';
import { adminCatalogApi } from '@/lib/admin-catalog-api';
import type { AdminBusinessLocationRow } from '@/lib/admin-business-locations-api';
import type { AdminCatalogLocale } from '@/lib/admin-catalog-labels';
import { adminCatalogLabel } from '@/lib/admin-catalog-labels';
import type { CityRow } from '@/lib/api';

type Props = {
  token: string;
  businessId: string;
  locale: AdminCatalogLocale;
  cities: CityRow[];
};

export function CatalogLocationsReadonly({ token, businessId, locale, cities }: Props) {
  const [items, setItems] = useState<AdminBusinessLocationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cityName = (cityId: string) => {
    const c = cities.find((x) => x.id === cityId);
    if (!c) return cityId;
    return locale === 'kk' && c.nameKk ? c.nameKk : c.nameRu;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminCatalogApi
      .listLocations(token, businessId)
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, businessId]);

  if (loading) return <p className="muted">{adminCatalogLabel(locale, 'loading')}</p>;
  if (error) return <p className="muted">{error}</p>;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{adminCatalogLabel(locale, 'sectionLocations')}</h3>
      {items.length === 0 ? (
        <p className="muted">—</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {items.map((loc) => (
            <li key={loc.id} style={{ marginBottom: 10 }}>
              {loc.isPrimary && <strong>PRIMARY · </strong>}
              <span>{loc.address}</span>
              <span className="muted"> · {cityName(loc.cityId)}</span>
              {loc.phone && <span className="muted"> · {loc.phone}</span>}
              {(loc.latitude != null || loc.longitude != null) && (
                <span className="muted">
                  {' '}
                  · {loc.latitude ?? '—'}, {loc.longitude ?? '—'}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
        {adminCatalogLabel(locale, 'locationsReadOnly')}
      </p>
    </div>
  );
}
