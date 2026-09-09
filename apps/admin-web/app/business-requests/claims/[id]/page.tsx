'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ModalDialog } from '@/components/business-requests/modal-dialog';
import { useBusinessRequestsContext } from '@/components/business-requests/business-requests-layout-client';
import { businessRequestsApi, type BusinessOwnershipClaimRow } from '@/lib/business-requests-api';
import {
  claimStatusClass,
  claimStatusLabel,
  mapBusinessRequestError,
  REJECTION_REASON_MAX,
  REJECTION_REASON_MIN,
  verificationMethodLabel,
} from '@/lib/business-requests-utils';
import { formatDateTime } from '@/lib/monetization-utils';

export default function OwnershipClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const { token } = useBusinessRequestsContext();

  const [item, setItem] = useState<BusinessOwnershipClaimRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return businessRequestsApi
      .getClaim(token, params.id)
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
      await businessRequestsApi.approveClaim(token, params.id);
      setApproveOpen(false);
      setToast('Права владельца подтверждены.');
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
      await businessRequestsApi.rejectClaim(token, params.id, {
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
        <Link href="/business-requests/claims" className="btn btn-sm">
          ← К списку
        </Link>
      </div>
    );
  }

  const isPending = item.status === 'PENDING';
  return (
    <div className="card">
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <Link href="/business-requests/claims" className="btn btn-sm">
          ← К списку
        </Link>
      </div>

      {toast && <p className="success-text">{toast}</p>}

      <h2 style={{ marginTop: 0 }}>{item.business?.title ?? 'Заявка на владение'}</h2>
      <p>
        <span className={claimStatusClass(item.status)}>
          {claimStatusLabel(item.status)}
        </span>
      </p>

      <dl className="detail-list">
        <dt>Город</dt>
        <dd>{item.business?.city?.nameRu ?? '—'}</dd>
        {item.business?.address && (
          <>
            <dt>Адрес</dt>
            <dd>{item.business.address}</dd>
          </>
        )}
        <dt>Способ проверки</dt>
        <dd>{verificationMethodLabel(item.verificationMethod)}</dd>
        <dt>Дата подачи</dt>
        <dd>{formatDateTime(item.createdAt)}</dd>
        {item.claimant && (
          <>
            <dt>Заявитель</dt>
            <dd>
              {item.claimant.name ?? '—'}
              {item.claimant.role ? ` (${item.claimant.role})` : ''}
            </dd>
          </>
        )}
        {item.claimantMessage && (
          <>
            <dt>Сообщение заявителя</dt>
            <dd>{item.claimantMessage}</dd>
          </>
        )}
        {item.rejectionReason && (
          <>
            <dt>Причина отклонения</dt>
            <dd>{item.rejectionReason}</dd>
          </>
        )}
        {item.reviewedAt && (
          <>
            <dt>Дата рассмотрения</dt>
            <dd>{formatDateTime(item.reviewedAt)}</dd>
          </>
        )}
      </dl>

      {isPending && (
        <>
          <div className="warning-banner" role="note">
            <p>
              После одобрения пользователь получит права владельца этого
              бизнеса.
            </p>
            <p>
              Существующий основной владелец не будет автоматически заменён.
            </p>
          </div>

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
              Подтвердить права владельца
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
        </>
      )}

      <ModalDialog
        open={approveOpen}
        title="Подтвердить права владельца?"
        onClose={() => !mutating && setApproveOpen(false)}
      >
        <p>
          Пользователь получит доступ владельца к существующей карточке
          бизнеса.
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
            {mutating ? 'Обработка…' : 'Подтвердить'}
          </button>
        </div>
      </ModalDialog>

      <ModalDialog
        open={rejectOpen}
        title="Отклонить заявку"
        onClose={() => !mutating && setRejectOpen(false)}
      >
        <p className="muted">Причина будет доступна заявителю.</p>
        <label htmlFor="claim-reject-reason">
          Причина отклонения
          <textarea
            id="claim-reject-reason"
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
