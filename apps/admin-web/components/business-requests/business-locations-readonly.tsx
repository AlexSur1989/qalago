'use client';

import { useEffect, useState } from 'react';
import {
  adminBusinessLocationsApi,
  type AdminBusinessLocationRow,
} from '@/lib/admin-business-locations-api';

type Props = {
  token: string;
  businessId: string;
};

export function BusinessLocationsReadonly({ token, businessId }: Props) {
  const [items, setItems] = useState<AdminBusinessLocationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminBusinessLocationsApi
      .listBusinessLocations(token, businessId)
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

  if (loading) return <p>Филиалы: загрузка…</p>;
  if (error) return <p className="muted">Филиалы: {error}</p>;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Филиалы ({items.length})</h3>
      {items.length === 0 ? (
        <p className="muted">Нет данных о филиалах.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {items.map((loc) => (
            <li key={loc.id} style={{ marginBottom: 8 }}>
              {loc.isPrimary && <strong>Основной · </strong>}
              <span>{loc.address}</span>
              <span className="muted"> · cityId={loc.cityId}</span>
              {loc.phone && <span className="muted"> · {loc.phone}</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
        Только просмотр. Редактирование — в Business Web владельцем.
      </p>
    </div>
  );
}
