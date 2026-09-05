'use client';

import { useEffect, useState } from 'react';
import {
  monetizationApi,
  AdPlacementRow,
  MonetizationPackageRow,
  MonetizationProductRow,
} from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import {
  formatDuration,
  formatKzt,
  parseApiError,
  placementLabel,
  productLabel,
} from '@/lib/monetization-utils';

export default function MonetizationPlacementsPage() {
  const { token, citySlug } = useMonetizationContext();
  const [placements, setPlacements] = useState<AdPlacementRow[]>([]);
  const [products, setProducts] = useState<MonetizationProductRow[]>([]);
  const [packages, setPackages] = useState<MonetizationPackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      monetizationApi.listPlacements(token),
      monetizationApi.listProducts(token, citySlug),
      monetizationApi.listPackages(token),
    ])
      .then(([p, pr, pk]) => {
        if (cancelled) return;
        setPlacements(p);
        setProducts(pr);
        setPackages(pk);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, citySlug]);

  return (
    <>
      <div className="page-header">
        <h1>Рекламные места</h1>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <h2>Placements (read-only)</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Code</th>
                <th>Статус</th>
                <th>maxVisible</th>
                <th>maxActiveCampaigns</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((p) => (
                <tr key={p.id}>
                  <td>{placementLabel(p.code)}</td>
                  <td>{p.code}</td>
                  <td>
                    {p.isActive ? (
                      <span className="tag tag-success">Активно</span>
                    ) : (
                      <span className="tag tag-muted">Неактивно</span>
                    )}
                  </td>
                  <td>{p.maxVisible}</td>
                  <td>{p.maxActiveCampaigns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Каталог цен (read-only)</h2>
        {products.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет продуктов</p>
        ) : (
          products.map((product) => (
            <div key={product.code} className="catalog-block">
              <h3>{productLabel(product.code)}</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Период</th>
                    <th>Цена</th>
                  </tr>
                </thead>
                <tbody>
                  {product.durations.map((d, idx) => (
                    <tr key={`${product.code}-${idx}`}>
                      <td>{formatDuration(d.durationDays ?? null, d.durationHours ?? null)}</td>
                      <td>{formatKzt(d.finalPrice, d.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2>Пакеты (read-only)</h2>
        {packages.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет пакетов</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Название</th>
                <th>Период</th>
                <th>Цена</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.code}>
                  <td>{pkg.code}</td>
                  <td>{pkg.name}</td>
                  <td>{formatDuration(pkg.durationDays, null)}</td>
                  <td>{formatKzt(pkg.price, pkg.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
