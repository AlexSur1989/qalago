'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SafeReportText } from '@/components/safe-report-text';
import { useModerationContext } from '@/components/moderation/moderation-layout-client';
import { moderationApi, type ModerationCaseDetail } from '@/lib/moderation-api';
import { moderationMediaScopeLabel } from '@/lib/moderation-media-utils';
import {
  reviewPublicVisibilityLabel,
  reviewTargetStateLabel,
} from '@/lib/moderation-review-utils';
import { mediaTargetStateLabel, staffMediaLabel } from '@/lib/staff-media-labels';
import {
  contentReportReasonLabel,
  mapModerationError,
  moderationCaseStatusClass,
  moderationCaseStatusLabel,
  moderationPriorityLabel,
  moderationTargetTypeLabel,
} from '@/lib/moderation-utils';
import { formatDateTime } from '@/lib/monetization-utils';
import { StaffPermission, staffRoleHasPermission } from '@qalago/shared-types';

export default function ModerationCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const { token, user } = useModerationContext();
  const canAct = staffRoleHasPermission(user.role, StaffPermission.MODERATION_ACT);

  const [item, setItem] = useState<ModerationCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionBusy, setActionBusy] = useState<
    'REVIEW_HIDE' | 'REVIEW_RESTORE' | 'MEDIA_HIDE' | 'MEDIA_RESTORE' | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return moderationApi
      .getCase(token, params.id)
      .then((data) => {
        setItem(data);
      })
      .catch((err: unknown) => setError(mapModerationError(String(err))))
      .finally(() => setLoading(false));
  }, [token, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMediaAction(actionType: 'MEDIA_HIDE' | 'MEDIA_RESTORE') {
    if (!item || !canAct) return;
    const note = actionNote.trim();
    const label = actionType === 'MEDIA_HIDE' ? 'скрыть фото' : 'вернуть фото';
    if (!window.confirm(`Подтвердите действие: ${label}?`)) return;

    setActionBusy(actionType);
    setActionError(null);
    try {
      await moderationApi.recordAction(token, item.id, {
        actionType,
        internalNote: note.length >= 3 ? note : undefined,
      });
      setToast(actionType === 'MEDIA_HIDE' ? 'Фото скрыто.' : 'Модерационное скрытие снято.');
      setActionNote('');
      await load();
    } catch (err: unknown) {
      setActionError(mapModerationError(String(err)));
    } finally {
      setActionBusy(null);
    }
  }

  async function handleReviewAction(actionType: 'REVIEW_HIDE' | 'REVIEW_RESTORE') {
    if (!item || !canAct) return;
    const note = actionNote.trim();
    if (note.length < 3) {
      setActionError('Укажите заметку модератора (минимум 3 символа).');
      return;
    }
    const label = actionType === 'REVIEW_HIDE' ? 'скрыть отзыв' : 'вернуть отзыв';
    if (!window.confirm(`Подтвердите действие: ${label}?`)) return;

    setActionBusy(actionType);
    setActionError(null);
    try {
      await moderationApi.recordAction(token, item.id, {
        actionType,
        internalNote: note,
      });
      setToast(actionType === 'REVIEW_HIDE' ? 'Отзыв скрыт.' : 'Модерационное скрытие снято.');
      setActionNote('');
      await load();
    } catch (err: unknown) {
      setActionError(mapModerationError(String(err)));
    } finally {
      setActionBusy(null);
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

        <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
          Статус меняется через действия модератора (скрытие/восстановление). Ручное изменение
          статуса недоступно.
        </p>
      </div>

      {item.targetType === 'MEDIA' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>{staffMediaLabel('ru', 'photoSection')}</h3>
          {!item.mediaTarget?.available ? (
            <p className="muted">{mediaTargetStateLabel(item.mediaTarget?.state, 'ru')}</p>
          ) : (
            <>
              <div className="moderation-meta" style={{ marginTop: 8 }}>
                <strong>{moderationMediaScopeLabel(item.mediaTarget, 'ru')}</strong>
              </div>
              <div className="moderation-meta">
                {item.mediaTarget.business?.title ?? '—'}
                {item.mediaTarget.business?.city?.nameRu
                  ? ` · ${item.mediaTarget.business.city.nameRu}`
                  : ''}
              </div>
              <div className="moderation-meta">
                {mediaTargetStateLabel(item.mediaTarget.state, 'ru')}
                {item.mediaTarget.id
                  ? ` · ID ${item.mediaTarget.id.slice(0, 12)}…`
                  : ''}
              </div>
              {item.mediaTarget.imageUrl && (
                <div style={{ marginTop: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.mediaTarget.imageUrl}
                    alt=""
                    style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 8 }}
                  />
                </div>
              )}
            </>
          )}

          {canAct && item.mediaTarget?.available && (
            <div style={{ marginTop: '1rem' }}>
              <label>
                Заметка модератора (необязательно)
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  style={{ width: '100%', maxWidth: 520 }}
                  placeholder="Комментарий для аудита"
                />
              </label>
              <div className="toolbar" style={{ marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={!!actionBusy || item.mediaTarget.moderationHidden === true}
                  onClick={() => handleMediaAction('MEDIA_HIDE')}
                >
                  {actionBusy === 'MEDIA_HIDE' ? 'Скрытие…' : 'Скрыть фото (MEDIA_HIDE)'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={!!actionBusy || item.mediaTarget.moderationHidden !== true}
                  onClick={() => handleMediaAction('MEDIA_RESTORE')}
                >
                  {actionBusy === 'MEDIA_RESTORE'
                    ? 'Восстановление…'
                    : 'Снять скрытие (MEDIA_RESTORE)'}
                </button>
              </div>
              {actionError && <p className="error-text">{actionError}</p>}
            </div>
          )}
        </div>
      )}

      {item.targetType === 'REVIEW' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Отзыв</h3>
          {item.reviewTarget?.contentMayHaveChangedSinceReport && (
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Текст отзыва мог измениться после жалобы — показано текущее состояние.
            </p>
          )}
          {!item.reviewTarget?.available ? (
            <p className="muted">
              {reviewTargetStateLabel(item.reviewTarget?.state ?? 'MISSING')}
            </p>
          ) : (
            <>
              <div className="moderation-meta" style={{ marginTop: 8 }}>
                <strong>{item.reviewTarget.business?.title ?? '—'}</strong>
                {item.reviewTarget.business?.city?.nameRu
                  ? ` · ${item.reviewTarget.business.city.nameRu}`
                  : ''}
              </div>
              <div className="moderation-meta">
                Автор отзыва:{' '}
                {item.reviewTarget.reviewer?.name ??
                  item.reviewTarget.reviewer?.phone ??
                  item.reviewTarget.reviewer?.id?.slice(0, 8) ??
                  '—'}
                {' · '}
                {item.reviewTarget.rating ?? '—'}★
              </div>
              <div className="moderation-meta">
                {reviewTargetStateLabel(item.reviewTarget.state)} ·{' '}
                {reviewPublicVisibilityLabel(item.reviewTarget.publiclyVisible)}
              </div>
              {item.reviewTarget.updatedAt && (
                <div className="moderation-meta">
                  Обновлён {formatDateTime(item.reviewTarget.updatedAt)}
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <SafeReportText text={item.reviewTarget.text} emptyLabel="Без текста" />
              </div>
              {item.reviewTarget.ownerReply && (
                <div style={{ marginTop: 8 }}>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    Ответ заведения
                  </div>
                  <SafeReportText text={item.reviewTarget.ownerReply} emptyLabel="—" />
                </div>
              )}
            </>
          )}

          {canAct && item.reviewTarget?.available && (
            <div style={{ marginTop: '1rem' }}>
              <label>
                Заметка модератора{' '}
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  style={{ width: '100%', maxWidth: 520 }}
                  placeholder="Причина решения для аудита"
                />
              </label>
              <div className="toolbar" style={{ marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={!!actionBusy || item.reviewTarget.moderationHidden === true}
                  onClick={() => handleReviewAction('REVIEW_HIDE')}
                >
                  {actionBusy === 'REVIEW_HIDE' ? 'Скрытие…' : 'Скрыть отзыв (REVIEW_HIDE)'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={
                    !!actionBusy || item.reviewTarget.moderationHidden !== true
                  }
                  onClick={() => handleReviewAction('REVIEW_RESTORE')}
                >
                  {actionBusy === 'REVIEW_RESTORE'
                    ? 'Восстановление…'
                    : 'Снять скрытие (REVIEW_RESTORE)'}
                </button>
              </div>
              {actionError && <p className="error-text">{actionError}</p>}
              {item.reviewTarget.state === 'USER_SOFT_DELETED' && (
                <p className="muted" style={{ fontSize: '0.85rem', marginTop: 8 }}>
                  REVIEW_RESTORE снимает только модерационное скрытие и не отменяет удаление
                  автором — отзыв останется вне публичного каталога.
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
