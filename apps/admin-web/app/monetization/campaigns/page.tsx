'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { monetizationApi, MonetizationCampaignRow } from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import { campaignStatusPresentation } from '@/lib/campaign-status-presentation';
import {
  campaignStatusLabel,
  formatDate,
  parseApiError,
  placementLabel,
  productLabel,
} from '@/lib/monetization-utils';
import { BackofficeBadge } from '@qalago/brand/badges';
import { BackofficeErrorState, BackofficeSkeleton } from '@qalago/brand/states';
import {
  BackofficeFilterSelect,
  BackofficePagination,
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

export default function MonetizationCampaignsPage() {
  const { token, citySlug } = useMonetizationContext();
  const [campaigns, setCampaigns] = useState<MonetizationCampaignRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [placementFilter, setPlacementFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [citySlug, statusFilter, placementFilter, productFilter]);

  function loadCampaigns() {
    setLoading(true);
    setError(null);
    monetizationApi
      .listCampaigns(token, { citySlug, page, limit: 50 })
      .then((res) => {
        setCampaigns(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, citySlug, page, refreshNonce]);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const status = c.effectiveStatus || c.status;
      if (statusFilter && status !== statusFilter) return false;
      if (productFilter && c.product.code !== productFilter) return false;
      if (placementFilter) {
        const codes = c.placements?.map((p) => p.code) ?? [];
        if (!codes.includes(placementFilter)) return false;
      }
      return true;
    });
  }, [campaigns, statusFilter, productFilter, placementFilter]);

  const pageCount = Math.max(1, Math.ceil(total / 50));

  return (
    <>
      <div className="page-header">
        <h1>Кампании</h1>
      </div>
      {error ? (
        <BackofficeErrorState
          title="Не удалось загрузить кампании"
          message={error}
          onRetry={() => setRefreshNonce((n) => n + 1)}
        />
      ) : null}

      <section className="card">
        <BackofficeTableToolbar
          start={
            <>
              <BackofficeFilterSelect
                label="Статус"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: '', label: 'Все статусы' },
                  { value: 'ACTIVE', label: campaignStatusLabel('ACTIVE') },
                  { value: 'SCHEDULED', label: campaignStatusLabel('SCHEDULED') },
                  { value: 'PENDING_MODERATION', label: campaignStatusLabel('PENDING_MODERATION') },
                  { value: 'PAUSED', label: campaignStatusLabel('PAUSED') },
                  { value: 'COMPLETED', label: campaignStatusLabel('COMPLETED') },
                  { value: 'CANCELLED', label: campaignStatusLabel('CANCELLED') },
                ]}
              />
              <BackofficeFilterSelect
                label="Продукт"
                value={productFilter}
                onChange={setProductFilter}
                options={[
                  { value: '', label: 'Все продукты' },
                  { value: 'BOOST', label: productLabel('BOOST') },
                  { value: 'TOP_CATEGORY', label: productLabel('TOP_CATEGORY') },
                  { value: 'PROMOTED_PROMOTION', label: productLabel('PROMOTED_PROMOTION') },
                  { value: 'FEATURED_BUSINESS', label: productLabel('FEATURED_BUSINESS') },
                  { value: 'VIP_BANNER', label: productLabel('VIP_BANNER') },
                ]}
              />
              <BackofficeFilterSelect
                label="Размещение"
                value={placementFilter}
                onChange={setPlacementFilter}
                options={[
                  { value: '', label: 'Все размещения' },
                  { value: 'HOME_VIP_BANNER', label: placementLabel('HOME_VIP_BANNER') },
                  { value: 'HOME_FEATURED', label: placementLabel('HOME_FEATURED') },
                  { value: 'HOME_PROMOTIONS', label: placementLabel('HOME_PROMOTIONS') },
                  { value: 'CATEGORY_TOP', label: placementLabel('CATEGORY_TOP') },
                  { value: 'CATEGORY_BOOST', label: placementLabel('CATEGORY_BOOST') },
                ]}
              />
            </>
          }
          meta={`Список кампаний · ${total} всего · фильтры на текущей странице (до 50)`}
        />

        {loading ? <BackofficeSkeleton variant="table-row" count={6} /> : null}

        {!loading && filtered.length === 0 ? (
          <BackofficeTableEmpty
            filtered={Boolean(statusFilter || productFilter || placementFilter)}
            emptyTitle="Кампаний пока нет"
            filteredTitle="Нет кампаний по выбранным фильтрам на этой странице"
            resetLabel="Сбросить фильтры"
            onResetFilters={() => {
              setStatusFilter('');
              setProductFilter('');
              setPlacementFilter('');
            }}
            icon="megaphone"
          />
        ) : null}

        {!loading && filtered.length > 0 && (
          <>
            <BackofficeTableContainer>
              <BackofficeTable density="compact" className="table-scroll">
                <BackofficeTableHead>
                  <tr>
                    <BackofficeTableHeaderCell>Бизнес</BackofficeTableHeaderCell>
                    <BackofficeTableHeaderCell>Тип</BackofficeTableHeaderCell>
                    <BackofficeTableHeaderCell>Размещение</BackofficeTableHeaderCell>
                    <BackofficeTableHeaderCell>Статус</BackofficeTableHeaderCell>
                    <BackofficeTableHeaderCell>Начало</BackofficeTableHeaderCell>
                    <BackofficeTableHeaderCell>Окончание</BackofficeTableHeaderCell>
                    <BackofficeTableHeaderCell variant="numeric">Показы</BackofficeTableHeaderCell>
                    <BackofficeTableHeaderCell variant="numeric">Просмотры</BackofficeTableHeaderCell>
                    <BackofficeTableHeaderCell variant="numeric">Переходы</BackofficeTableHeaderCell>
                    <BackofficeTableHeaderCell variant="actions">Действия</BackofficeTableHeaderCell>
                  </tr>
                </BackofficeTableHead>
                <BackofficeTableBody>
                  {filtered.map((c) => {
                    const status = c.effectiveStatus || c.status;
                    const placementCode = c.placements?.[0]?.code;
                    const statusPresentation = campaignStatusPresentation(status);
                    return (
                      <BackofficeTableRow key={c.id}>
                        <BackofficeTableCell variant="truncate">
                          {c.businessTitle ?? c.businessId.slice(0, 8)}
                        </BackofficeTableCell>
                        <BackofficeTableCell>{productLabel(c.product.code)}</BackofficeTableCell>
                        <BackofficeTableCell>{placementLabel(placementCode)}</BackofficeTableCell>
                        <BackofficeTableCell>
                          <BackofficeBadge
                            label={statusPresentation.label}
                            tone={statusPresentation.tone}
                            size="compact"
                          />
                        </BackofficeTableCell>
                        <BackofficeTableCell>{formatDate(c.startAt)}</BackofficeTableCell>
                        <BackofficeTableCell>{formatDate(c.endAt)}</BackofficeTableCell>
                        <BackofficeTableCell variant="numeric">{c.metrics.servedCount}</BackofficeTableCell>
                        <BackofficeTableCell variant="numeric">
                          {c.metrics.qualifiedImpressions}
                        </BackofficeTableCell>
                        <BackofficeTableCell variant="numeric">{c.metrics.clickCount}</BackofficeTableCell>
                        <BackofficeTableCell variant="actions">
                          <Link href={`/monetization/campaigns/${c.id}`} className="btn btn-sm">
                            Открыть
                          </Link>
                        </BackofficeTableCell>
                      </BackofficeTableRow>
                    );
                  })}
                </BackofficeTableBody>
              </BackofficeTable>
            </BackofficeTableContainer>
            <BackofficePagination page={page} totalPages={pageCount} onPageChange={setPage} />
          </>
        )}
      </section>
    </>
  );
}
