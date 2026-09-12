'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SafeReportText } from '@/components/safe-report-text';
import { useLegalContext } from '@/components/legal/legal-layout-client';
import { legalApi, type DataRightsRequestRow } from '@/lib/legal-api';
import {
  dataRightsRequestStatusClass,
  dataRightsRequestStatusLabel,
  dataRightsRequestTypeLabel,
  mapLegalError,
} from '@/lib/legal-utils';
import { formatDateTime } from '@/lib/monetization-utils';

export default function DataRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { token } = useLegalContext();

  const [item, setItem] = useState<DataRightsRequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return legalApi
      .getDataRequest(token, params.id)
      .then((data) => {
        setItem(data);
        setStatusDraft(data.status);
        setAdminNote(data.adminNote ?? '');
      })
      .catch((err: unknown) => setError(mapLegalError(String(err))))
      .finally(() => setLoading(false));
  }, [token, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!item) return;
    setSaving(true);
    setSaveError(null);
    try {
      await legalApi.updateDataRequest(token, item.id, {
        status: statusDraft,
        adminNote: adminNote.trim() || undefined,
      });
      await load();
    } catch (err: unknown) {
      setSaveError(mapLegalError(String(err)));
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
        <p className="error-text">{error ?? 'Запрос не найден.'}</p>
        <Link href="/legal/data-requests" className="btn btn-sm">
          ← К списку
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <Link href="/legal/data-requests" className="text-link">
        ← Запросы субъектов данных
      </Link>
      <h2 style={{ margin: '0.5rem 0' }}>{dataRightsRequestTypeLabel(item.type)}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Получено {formatDateTime(item.requestedAt)}
      </p>
      <p>
        <span className={dataRightsRequestStatusClass(item.status)}>
          {dataRightsRequestStatusLabel(item.status)}
        </span>
      </p>

      <dl className="detail-grid">
        <dt>Пользователь</dt>
        <dd>
          {item.user?.name ?? '—'}
          {item.user?.phone ? ` · ${item.user.phone}` : ''}
          {item.user?.email ? ` · ${item.user.email}` : ''}
        </dd>
        <dt>Код причины</dt>
        <dd>
          <SafeReportText text={item.reasonCode} emptyLabel="—" />
        </dd>
      </dl>

      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '12px', marginTop: '1rem' }}>
        <label>
          Статус{' '}
          <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
            {[
              'SUBMITTED',
              'IDENTITY_VERIFICATION_REQUIRED',
              'IN_REVIEW',
              'APPROVED',
              'PROCESSING',
              'COMPLETED',
              'REJECTED',
              'CANCELLED',
            ].map((s) => (
              <option key={s} value={s}>
                {dataRightsRequestStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label style={{ display: 'block', marginTop: '1rem' }}>
        Внутренняя заметка (plain text)
        <textarea
          className="input-block"
          rows={4}
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          style={{ width: '100%', marginTop: '4px' }}
        />
      </label>

      <div style={{ marginTop: '1rem' }}>
        <button type="button" className="btn btn-sm" disabled={saving} onClick={handleSave}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
      {saveError && <p className="error-text">{saveError}</p>}
    </div>
  );
}
