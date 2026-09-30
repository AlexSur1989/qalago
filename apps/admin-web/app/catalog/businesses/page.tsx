'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useCatalogContext } from '@/components/catalog/catalog-layout-client';
import { adminCatalogApi, type AdminCatalogListItem } from '@/lib/admin-catalog-api';
import { adminCatalogLabel, adminCatalogStatusLabel } from '@/lib/admin-catalog-labels';
import { parseAdminCatalogApiError } from '@/lib/admin-catalog-errors';
import { canCreateAdminCatalogBusiness } from '@/lib/admin-catalog-rbac';
import { BackofficeBadge } from '@qalago/brand/badges';
import { businessStatusPresentation } from '@qalago/brand/status';
import {
  BackofficeErrorState,
  BackofficeSkeleton,
} from '@qalago/brand/states';
import {
  BackofficeFilterSelect,
  BackofficePagination,
  BackofficeSearchField,
  BackofficeTable,
  BackofficeTableBody,
  BackofficeTableCell,
  BackofficeTableContainer,
  BackofficeTableEmpty,
  BackofficeTableHead,
  BackofficeTableHeaderCell,
  BackofficeTableRow,
  BackofficeTableToolbar,
} from '@qalago/brand/tables';

export default function CatalogBusinessesListPage() {
  const { token, user, citySlug, locale } = useCatalogContext();
  const [items, setItems] = useState<AdminCatalogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [refreshNonce, setRefreshNonce] = useState(0);

  const canCreate = canCreateAdminCatalogBusiness(user.role);

  const statusOptions = useMemo(
    () => [
      { value: '', label: adminCatalogLabel(locale, 'filterAll') },
      { value: 'PENDING', label: businessStatusPresentation('PENDING').label },
      { value: 'ACTIVE', label: businessStatusPresentation('ACTIVE').label },
      { value: 'BLOCKED', label: businessStatusPresentation('BLOCKED').label },
    ],
    [locale],
  );

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

  const filteredItems = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        (b.city?.nameRu?.toLowerCase().includes(q) ?? false),
    );
  }, [items, searchInput]);

  const hasActiveFilters = Boolean(statusFilter || searchInput.trim());
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function resetFilters() {
    setStatusFilter('');
    setSearchInput('');
    setPage(1);
  }

  return (
    <section>
      <h1 className="page-title" style={{ marginTop: 0 }}>
        {adminCatalogLabel(locale, 'pageListTitle')}
      </h1>

      <BackofficeTableToolbar
        start={
          <>
            <BackofficeSearchField
              label={adminCatalogLabel(locale, 'searchLabel')}
              placeholder={adminCatalogLabel(locale, 'searchLabel')}
              value={searchInput}
              onChange={setSearchInput}
            />
            <BackofficeFilterSelect
              label={adminCatalogLabel(locale, 'filterStatus')}
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
          </>
        }
        end={
          canCreate ? (
            <Link href="/catalog/businesses/new" className="btn btn-primary">
              {adminCatalogLabel(locale, 'createAction')}
            </Link>
          ) : null
        }
        meta={
          !loading && !error
            ? `${filteredItems.length} из ${meta.total} на странице ${meta.page}`
            : undefined
        }
      />

      {loading ? <BackofficeSkeleton variant="table-row" count={5} /> : null}
      {error ? (
        <BackofficeErrorState
          title={adminCatalogLabel(locale, 'errorLoad')}
          message={error}
          onRetry={() => setRefreshNonce((n) => n + 1)}
        />
      ) : null}

      {!loading && !error && filteredItems.length === 0 ? (
        <BackofficeTableEmpty
          filtered={hasActiveFilters}
          emptyTitle={adminCatalogLabel(locale, 'emptyNoData')}
          filteredTitle={adminCatalogLabel(locale, 'emptyList')}
          resetLabel={adminCatalogLabel(locale, 'resetFilters')}
          onResetFilters={hasActiveFilters ? resetFilters : undefined}
          icon="business"
        />
      ) : null}

      {!loading && !error && filteredItems.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <BackofficeTableContainer>
            <BackofficeTable density="normal">
              <BackofficeTableHead>
                <tr>
                  <BackofficeTableHeaderCell>{adminCatalogLabel(locale, 'colTitle')}</BackofficeTableHeaderCell>
                  <BackofficeTableHeaderCell>{adminCatalogLabel(locale, 'colStatus')}</BackofficeTableHeaderCell>
                  <BackofficeTableHeaderCell>{adminCatalogLabel(locale, 'colCity')}</BackofficeTableHeaderCell>
                  <BackofficeTableHeaderCell>{adminCatalogLabel(locale, 'colCategory')}</BackofficeTableHeaderCell>
                  <BackofficeTableHeaderCell>{adminCatalogLabel(locale, 'colSlug')}</BackofficeTableHeaderCell>
                  <BackofficeTableHeaderCell variant="actions">
                    {adminCatalogLabel(locale, 'colActions')}
                  </BackofficeTableHeaderCell>
                </tr>
              </BackofficeTableHead>
              <BackofficeTableBody>
                {filteredItems.map((b) => (
                  <BackofficeTableRow key={b.id}>
                    <BackofficeTableCell variant="truncate">{b.title}</BackofficeTableCell>
                    <BackofficeTableCell>
                      <BackofficeBadge
                        label={adminCatalogStatusLabel(locale, b.status)}
                        tone={businessStatusPresentation(b.status).tone}
                        size="compact"
                      />
                    </BackofficeTableCell>
                    <BackofficeTableCell>{b.city?.nameRu ?? '—'}</BackofficeTableCell>
                    <BackofficeTableCell>{b.category?.title ?? '—'}</BackofficeTableCell>
                    <BackofficeTableCell variant="mono">{b.slug}</BackofficeTableCell>
                    <BackofficeTableCell variant="actions">
                      <Link href={`/catalog/businesses/${b.id}`}>{adminCatalogLabel(locale, 'openDetail')}</Link>
                    </BackofficeTableCell>
                  </BackofficeTableRow>
                ))}
              </BackofficeTableBody>
            </BackofficeTable>
          </BackofficeTableContainer>
          <BackofficePagination
            page={page}
            totalPages={totalPages}
            totalItems={meta.total}
            pageSize={meta.limit}
            onPageChange={setPage}
          />
        </div>
      )}
    </section>
  );
}
