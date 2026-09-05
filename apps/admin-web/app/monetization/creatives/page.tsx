'use client';

import { useEffect, useState } from 'react';
import { monetizationApi, MonetizationCreativeRow } from '@/lib/monetization-api';
import { useMonetizationContext } from '@/components/monetization/monetization-layout-client';
import { VipBannerPreview } from '@/components/monetization/vip-banner-preview';
import { confirmAction } from '@/lib/admin-utils';
import {
  creativeStatusLabel,
  formatDateTime,
  monetizationStatusClass,
  parseApiError,
} from '@/lib/monetization-utils';

export default function MonetizationCreativesPage() {
  const { token, citySlug } = useMonetizationContext();
  const [creatives, setCreatives] = useState<MonetizationCreativeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [selected, setSelected] = useState<MonetizationCreativeRow | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadCreatives() {
    setLoading(true);
    setError(null);
    try {
      const res = await monetizationApi.listCreatives(token, {
        citySlug,
        moderationStatus: statusFilter || undefined,
        limit: 50,
      });
      setCreatives(res.items);
      setTotal(res.total);
      if (selected) {
        const updated = res.items.find((c) => c.id === selected.id);
        setSelected(updated ?? null);
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCreatives().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, citySlug, statusFilter]);

  async function approveCreative(creative: MonetizationCreativeRow) {
    if (!confirmAction('Одобрить рекламный баннер?')) return;
    setActionLoading(`approve-${creative.id}`);
    setError(null);
    setInfo(null);
    try {
      await monetizationApi.approveCreative(token, creative.id);
      setInfo('Баннер одобрен.');
      await loadCreatives();
    } catch (err) {
      setError('Не удалось одобрить баннер.');
      console.debug(parseApiError(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectCreative(creative: MonetizationCreativeRow) {
    if (!confirmAction('Отклонить рекламный баннер?')) return;
    setActionLoading(`reject-${creative.id}`);
    setError(null);
    setInfo(null);
    try {
      await monetizationApi.rejectCreative(
        token,
        creative.id,
        rejectComment.trim() || undefined,
      );
      setInfo('Баннер отклонён.');
      setRejectComment('');
      await loadCreatives();
    } catch (err) {
      setError('Не удалось отклонить баннер.');
      console.debug(parseApiError(err));
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Креативы</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <section className="card">
        <div className="table-toolbar">
          <h2>VIP-баннеры ({total})</h2>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="PENDING">На модерации</option>
            <option value="APPROVED">Одобрено</option>
            <option value="REJECTED">Отклонено</option>
            <option value="DRAFT">Черновик</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
        ) : creatives.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет креативов на модерации</p>
        ) : (
          <div className="creatives-layout">
            <table className="table">
              <thead>
                <tr>
                  <th>Бизнес</th>
                  <th>Заголовок</th>
                  <th>Статус</th>
                  <th>Создан</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {creatives.map((c) => (
                  <tr key={c.id}>
                    <td>{c.business?.title ?? '—'}</td>
                    <td>{c.title}</td>
                    <td>
                      <span className={monetizationStatusClass(c.moderationStatus)}>
                        {creativeStatusLabel(c.moderationStatus)}
                      </span>
                    </td>
                    <td>{formatDateTime(c.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setSelected(c)}
                      >
                        Просмотр
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selected && (
              <aside className="creative-preview-panel">
                <h3>Модерация баннера</h3>
                <p className="table-sub">{selected.business?.title}</p>
                <VipBannerPreview creative={selected} />
                <dl className="detail-grid compact">
                  <dt>CTA</dt>
                  <dd>{selected.buttonText ?? '—'}</dd>
                  <dt>Target</dt>
                  <dd>
                    {selected.targetType}
                    {selected.targetUrl ? `: ${selected.targetUrl}` : ''}
                    {selected.targetId ? `: ${selected.targetId}` : ''}
                  </dd>
                  <dt>Статус</dt>
                  <dd>{creativeStatusLabel(selected.moderationStatus)}</dd>
                </dl>

                {selected.moderationStatus === 'PENDING' && (
                  <>
                    <label className="field-label">
                      Причина отклонения (опционально)
                      <textarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        rows={3}
                        className="markdown-box"
                      />
                    </label>
                    <div className="action-row">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={actionLoading != null}
                        onClick={() => approveCreative(selected)}
                      >
                        {actionLoading === `approve-${selected.id}` ? '…' : 'Одобрить'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={actionLoading != null}
                        onClick={() => rejectCreative(selected)}
                      >
                        {actionLoading === `reject-${selected.id}` ? '…' : 'Отклонить'}
                      </button>
                    </div>
                  </>
                )}
              </aside>
            )}
          </div>
        )}
      </section>
    </>
  );
}
