'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { monetizationApi, MonetizationCampaignRow } from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import {
  campaignStatusLabel,
  formatDate,
  monetizationStatusClass,
  parseApiError,
  placementLabel,
  productLabel,
} from '@/lib/monetization-utils';

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

  useEffect(() => {
    setPage(1);
  }, [citySlug, statusFilter, placementFilter, productFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    monetizationApi
      .listCampaigns(token, { citySlug, page, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setCampaigns(res.items);
        setTotal(res.total);
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
  }, [token, citySlug, page]);

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
      {error && <div className="alert alert-error">Не удалось загрузить кампании. {error}</div>}

      <section className="card">
        <div className="table-toolbar">
          <h2>Список кампаний ({total})</h2>
          <div className="filter-row">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Все статусы</option>
              <option value="ACTIVE">Активно</option>
              <option value="SCHEDULED">Запланировано</option>
              <option value="PENDING_MODERATION">На модерации</option>
              <option value="PAUSED">Приостановлено</option>
              <option value="COMPLETED">Завершено</option>
              <option value="CANCELLED">Отменено</option>
            </select>
            <select
              className="filter-select"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="">Все продукты</option>
              <option value="BOOST">Поднять карточку</option>
              <option value="TOP_CATEGORY">TOP категории</option>
              <option value="PROMOTED_PROMOTION">Продвинуть акцию</option>
              <option value="FEATURED_BUSINESS">Популярное место</option>
              <option value="VIP_BANNER">VIP-баннер</option>
            </select>
            <select
              className="filter-select"
              value={placementFilter}
              onChange={(e) => setPlacementFilter(e.target.value)}
            >
              <option value="">Все placements</option>
              <option value="HOME_VIP_BANNER">VIP-баннер</option>
              <option value="HOME_FEATURED">Популярные места</option>
              <option value="HOME_PROMOTIONS">Акции</option>
              <option value="CATEGORY_TOP">TOP категории</option>
              <option value="CATEGORY_BOOST">Поднятые карточки</option>
            </select>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 0 }}>
          Фильтры применяются к загруженной странице (до 50 записей). Backend-фильтр по статусу
          пока не поддерживается.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет кампаний</p>
        ) : (
          <>
            <table className="table table-scroll">
              <thead>
                <tr>
                  <th>Бизнес</th>
                  <th>Тип</th>
                  <th>Placement</th>
                  <th>Статус</th>
                  <th>Начало</th>
                  <th>Окончание</th>
                  <th>Показы</th>
                  <th>Просмотры</th>
                  <th>Переходы</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const status = c.effectiveStatus || c.status;
                  const placementCode = c.placements?.[0]?.code;
                  return (
                    <tr key={c.id}>
                      <td>{c.businessTitle ?? c.businessId.slice(0, 8)}</td>
                      <td>{productLabel(c.product.code)}</td>
                      <td>{placementLabel(placementCode)}</td>
                      <td>
                        <span className={monetizationStatusClass(status)}>
                          {campaignStatusLabel(status)}
                        </span>
                      </td>
                      <td>{formatDate(c.startAt)}</td>
                      <td>{formatDate(c.endAt)}</td>
                      <td>{c.metrics.servedCount}</td>
                      <td>{c.metrics.qualifiedImpressions}</td>
                      <td>{c.metrics.clickCount}</td>
                      <td>
                        <Link href={`/monetization/campaigns/${c.id}`} className="btn btn-sm">
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pageCount > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Назад
                </button>
                <span className="pagination-meta">
                  Стр. {page} из {pageCount}
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
