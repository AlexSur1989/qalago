'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SafeReportText } from '@/components/safe-report-text';
import { useModerationContext } from '@/components/moderation/moderation-layout-client';
import { moderationApi, type ModerationCaseDetail } from '@/lib/moderation-api';
import {
  contentReportReasonLabel,
  mapModerationError,
  moderationCaseStatusClass,
  moderationCaseStatusLabel,
  moderationPriorityLabel,
  moderationTargetTypeLabel,
} from '@/lib/moderation-utils';
import { formatDateTime } from '@/lib/monetization-utils';

export default function ModerationCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const { token } = useModerationContext();

  const [item, setItem] = useState<ModerationCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return moderationApi
      .getCase(token, params.id)
      .then((data) => {
        setItem(data);
        setStatusDraft(data.status);
      })
      .catch((err: unknown) => setError(mapModerationError(String(err))))
      .finally(() => setLoading(false));
  }, [token, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveStatus() {
    if (!item || statusDraft === item.status) return;
    setSaving(true);
    setSaveError(null);
    try {
      await moderationApi.updateCase(token, item.id, { status: statusDraft });
      setToast('Статус обновлён.');
      await load();
    } catch (err: unknown) {
      setSaveError(mapModerationError(String(err)));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p>Загрузка…</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="card">
        <p className="error-text">{error ?? 'Кейс не найден.'}</p>
        <Link href="/moderation/cases" className="btn btn-sm">
          ← К списку
        </Link>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <p className="toast-banner" role="status">
          {toast}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setToast(null)}>
            ✕
          </button>
        </p>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="toolbar" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <Link href="/moderation/cases" className="text-link">
              ← Кейсы
            </Link>
            <h2 style={{ margin: '0.5rem 0 0' }}>
              {moderationTargetTypeLabel(item.targetType)} · {item.targetId.slice(0, 12)}…
            </h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Создан {formatDateTime(item.createdAt)}
              {item.city?.nameRu ? ` · ${item.city.nameRu}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={moderationCaseStatusClass(item.status)}>
              {moderationCaseStatusLabel(item.status)}
            </span>
            <span className="tag tag-muted">{moderationPriorityLabel(item.priority)}</span>
          </div>
        </div>

        <div className="toolbar" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '12px' }}>
          <label>
            Новый статус{' '}
            <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
              {[
                'OPEN',
                'TRIAGED',
                'IN_REVIEW',
                'ACTION_REQUIRED',
                'RESOLVED',
                'DISMISSED',
                'APPEALED',
              ].map((s) => (
                <option key={s} value={s}>
                  {moderationCaseStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-sm"
            disabled={saving || statusDraft === item.status}
            onClick={handleSaveStatus}
          >
            {saving ? 'Сохранение…' : 'Сохранить статус'}
          </button>
        </div>
        {saveError && <p className="error-text">{saveError}</p>}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Жалобы ({item.reports?.length ?? 0})</h3>
        {!item.reports?.length && <p className="muted">Жалоб не привязано.</p>}
        {item.reports?.map((report) => (
          <div key={report.id} className="moderation-card" style={{ marginTop: '12px' }}>
            <div className="moderation-body">
              <div className="moderation-meta">
                <strong>{contentReportReasonLabel(report.reason)}</strong>
                {' · '}
                {formatDateTime(report.createdAt)}
              </div>
              <div className="moderation-meta">
                Автор: {report.reporter?.name ?? report.reporter?.phone ?? 'Аноним / удалён'}
              </div>
              <div style={{ marginTop: '8px' }}>
                <div className="muted" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                  Текст жалобы (plain text)
                </div>
                <SafeReportText text={report.details} emptyLabel="Без комментария" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {item.targetSnapshot && Object.keys(item.targetSnapshot).length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Снимок объекта</h3>
          <SafeReportText text={JSON.stringify(item.targetSnapshot, null, 2)} emptyLabel="—" />
        </div>
      )}

      <div className="card">
        <h3>Действия модератора ({item.actions?.length ?? 0})</h3>
        {!item.actions?.length && <p className="muted">Действий пока нет.</p>}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Действие</th>
                <th>Модератор</th>
                <th>Заметка</th>
              </tr>
            </thead>
            <tbody>
              {item.actions?.map((action) => (
                <tr key={action.id}>
                  <td>{formatDateTime(action.createdAt)}</td>
                  <td>{action.actionType}</td>
                  <td>{action.actorAdmin?.name ?? action.actorAdminId.slice(0, 8)}</td>
                  <td>
                    <SafeReportText text={action.internalNote} emptyLabel="—" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
