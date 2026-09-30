'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCatalogContext } from '@/components/catalog/catalog-layout-client';
import { adminCatalogApi, type AdminCatalogListItem } from '@/lib/admin-catalog-api';
import { adminCatalogLabel, adminCatalogStatusLabel } from '@/lib/admin-catalog-labels';
import { parseAdminCatalogApiError } from '@/lib/admin-catalog-errors';
import { canCreateAdminCatalogBusiness } from '@/lib/admin-catalog-rbac';
import { BackofficeBadge } from '@qalago/brand/badges';
import { businessStatusPresentation } from '@qalago/brand/status';
import {
  BackofficeEmptyState,
  BackofficeErrorState,
  BackofficeSkeleton,
} from '@qalago/brand/states';

export default function CatalogBusinessesListPage() {
  const { token, user, citySlug, locale } = useCatalogContext();
  const [items, setItems] = useState<AdminCatalogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [refreshNonce, setRefreshNonce] = useState(0);

  const canCreate = canCreateAdminCatalogBusiness(user.role);

  useEffect(() => {
    setPage(1);
  }, [citySlug, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminCatalogApi
      .listBusinesses(token, {
        citySlug,
        status: statusFilter || undefined,
        page,
        limit: 20,
      })
      .then((res) => {
        if (!cancelled) {
          setItems(res.items);
          setMeta(res.meta);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(parseAdminCatalogApiError(err, locale).message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, citySlug, statusFilter, page, locale, refreshNonce]);

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0 }}>{adminCatalogLabel(locale, 'pageListTitle')}</h1>
        {canCreate && (
          <Link href="/catalog/businesses/new" className="btn btn-primary">
            {adminCatalogLabel(locale, 'createAction')}
          </Link>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>{adminCatalogLabel(locale, 'filterStatus')}</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="city-select">
            <option value="">{adminCatalogLabel(locale, 'filterAll')}</option>
            <option value="PENDING">{businessStatusPresentation('PENDING').label}</option>
            <option value="ACTIVE">{businessStatusPresentation('ACTIVE').label}</option>
            <option value="BLOCKED">{businessStatusPresentation('BLOCKED').label}</option>
          </select>
        </label>
      </div>

      {loading ? <BackofficeSkeleton variant="table-row" count={5} /> : null}
      {error ? (
        <BackofficeErrorState
          title={adminCatalogLabel(locale, 'errorLoad')}
          message={error}
          onRetry={() => setRefreshNonce((n) => n + 1)}
        />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <BackofficeEmptyState
          title={adminCatalogLabel(locale, 'emptyList')}
          icon="business"
          density="section"
        />
      ) : null}

      {!loading && !error && items.length > 0 && (
        <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th align="left">{adminCatalogLabel(locale, 'colTitle')}</th>
                <th align="left">{adminCatalogLabel(locale, 'colStatus')}</th>
                <th align="left">{adminCatalogLabel(locale, 'colCity')}</th>
                <th align="left">{adminCatalogLabel(locale, 'colCategory')}</th>
                <th align="left">{adminCatalogLabel(locale, 'colSlug')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}</td>
                  <td>
                    <BackofficeBadge
                      label={adminCatalogStatusLabel(locale, b.status)}
                      tone={businessStatusPresentation(b.status).tone}
                      size="compact"
                    />
                  </td>
                  <td>{b.city?.nameRu ?? '—'}</td>
                  <td>{b.category?.title ?? '—'}</td>
                  <td className="muted">{b.slug}</td>
                  <td>
                    <Link href={`/catalog/businesses/${b.id}`}>{adminCatalogLabel(locale, 'openDetail')}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta.total > meta.limit && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ←
              </button>
              <span className="muted">
                {meta.page} / {Math.ceil(meta.total / meta.limit)}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page * meta.limit >= meta.total}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
