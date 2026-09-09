'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ModalDialog } from '@/components/business-requests/modal-dialog';
import { useBusinessRequestsContext } from '@/components/business-requests/business-requests-layout-client';
import { businessRequestsApi, type BusinessApplicationRow } from '@/lib/business-requests-api';
import {
  applicationStatusClass,
  applicationStatusLabel,
  mapBusinessRequestError,
  REJECTION_REASON_MAX,
  REJECTION_REASON_MIN,
} from '@/lib/business-requests-utils';
import { formatDateTime } from '@/lib/monetization-utils';

export default function BusinessApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const { token } = useBusinessRequestsContext();

  const [item, setItem] = useState<BusinessApplicationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [createdBusiness, setCreatedBusiness] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return businessRequestsApi
      .getApplication(token, params.id)
      .then(setItem)
      .catch((err: unknown) => setError(mapBusinessRequestError(String(err))))
      .finally(() => setLoading(false));
  }, [token, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const rejectValid =
    rejectReason.trim().length >= REJECTION_REASON_MIN &&
    rejectReason.trim().length <= REJECTION_REASON_MAX;

  async function handleApprove() {
    setMutating(true);
    setMutationError(null);
    try {
      const res = await businessRequestsApi.approveApplication(token, params.id);
      if (res.business) {
        setCreatedBusiness({ id: res.business.id, title: res.business.title });
      }
      setApproveOpen(false);
      setToast('Заявка одобрена. Создана карточка бизнеса.');
      await load();
    } catch (err: unknown) {
      setMutationError(mapBusinessRequestError(String(err)));
    } finally {
      setMutating(false);
    }
  }

  async function handleReject() {
    if (!rejectValid) return;
    setMutating(true);
    setMutationError(null);
    try {
      await businessRequestsApi.rejectApplication(token, params.id, {
        rejectionReason: rejectReason.trim(),
      });
      setRejectOpen(false);
      setRejectReason('');
      setToast('Заявка отклонена.');
      await load();
    } catch (err: unknown) {
      setMutationError(mapBusinessRequestError(String(err)));
    } finally {
      setMutating(false);
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
        <p className="error-text">{error ?? 'Заявка не найдена.'}</p>
        <Link href="/business-requests/applications" className="btn btn-sm">
          ← К списку
        </Link>
      </div>
    );
  }

  const isPending = item.status === 'PENDING';
  const approvedBusiness = createdBusiness ?? item.approvedBusiness;

  return (
    <div className="card">
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <Link href="/business-requests/applications" className="btn btn-sm">
          ← К списку
        </Link>
      </div>

      {toast && <p className="success-text">{toast}</p>}

      <h2 style={{ marginTop: 0 }}>{item.title}</h2>
      <p>
        <span className={applicationStatusClass(item.status)}>
          {applicationStatusLabel(item.status)}
        </span>
      </p>

      <dl className="detail-list">
        <dt>Город</dt>
        <dd>{item.city?.nameRu ?? '—'}</dd>
        <dt>Категория</dt>
        <dd>{item.category?.title ?? '—'}</dd>
        <dt>Адрес</dt>
        <dd>{item.address}</dd>
        {item.shortDesc && (
          <>
            <dt>Описание</dt>
            <dd>{item.shortDesc}</dd>
          </>
        )}
        {item.phone && (
          <>
            <dt>Контактный телефон</dt>
            <dd>{item.phone}</dd>
          </>
        )}
        <dt>Дата подачи</dt>
        <dd>{formatDateTime(item.createdAt)}</dd>
        {item.applicant && (
          <>
            <dt>Заявитель</dt>
            <dd>
              {item.applicant.name ?? '—'}
              {item.applicant.role ? ` (${item.applicant.role})` : ''}
            </dd>
          </>
        )}
        {item.rejectionReason && (
          <>
            <dt>Причина отклонения</dt>
            <dd>{item.rejectionReason}</dd>
          </>
        )}
        {approvedBusiness && item.status === 'APPROVED' && (
          <>
            <dt>Бизнес</dt>
            <dd>{approvedBusiness.title}</dd>
          </>
        )}
      </dl>

      {isPending && (
        <div className="toolbar" style={{ marginTop: '1.5rem', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={mutating}
            onClick={() => {
              setMutationError(null);
              setApproveOpen(true);
            }}
          >
            Одобрить
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={mutating}
            onClick={() => {
              setMutationError(null);
              setRejectOpen(true);
            }}
          >
            Отклонить
          </button>
        </div>
      )}

      <ModalDialog
        open={approveOpen}
        title="Одобрить создание бизнеса?"
        onClose={() => !mutating && setApproveOpen(false)}
      >
        <p>
          После одобрения будет создана карточка бизнеса и заявитель получит
          права владельца.
        </p>
        {mutationError && <p className="error-text">{mutationError}</p>}
        <div className="modal-actions">
          <button
            type="button"
            className="btn"
            disabled={mutating}
            onClick={() => setApproveOpen(false)}
          >
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={mutating}
            onClick={handleApprove}
          >
            {mutating ? 'Обработка…' : 'Одобрить'}
          </button>
        </div>
      </ModalDialog>

      <ModalDialog
        open={rejectOpen}
        title="Отклонить заявку"
        onClose={() => !mutating && setRejectOpen(false)}
      >
        <p className="muted">Причина будет доступна заявителю.</p>
        <label htmlFor="reject-reason">
          Причина отклонения
          <textarea
            id="reject-reason"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            maxLength={REJECTION_REASON_MAX}
            disabled={mutating}
          />
        </label>
        <p className="muted">
          {rejectReason.trim().length}/{REJECTION_REASON_MAX} (мин.{' '}
          {REJECTION_REASON_MIN})
        </p>
        {mutationError && <p className="error-text">{mutationError}</p>}
        <div className="modal-actions">
          <button
            type="button"
            className="btn"
            disabled={mutating}
            onClick={() => setRejectOpen(false)}
          >
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={mutating || !rejectValid}
            onClick={handleReject}
          >
            {mutating ? 'Отправка…' : 'Отклонить'}
          </button>
        </div>
      </ModalDialog>
    </div>
  );
}
