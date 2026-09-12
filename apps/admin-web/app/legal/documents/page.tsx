'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SafeReportText } from '@/components/safe-report-text';
import { useLegalContext } from '@/components/legal/legal-layout-client';
import { legalApi, type LegalDocumentRow } from '@/lib/legal-api';
import {
  legalDocumentStatusClass,
  legalDocumentStatusLabel,
  legalDocumentTypeLabel,
  mapLegalError,
} from '@/lib/legal-utils';
import { formatDateTime } from '@/lib/monetization-utils';

export default function LegalDocumentsPage() {
  const searchParams = useSearchParams();
  const { token } = useLegalContext();
  const selectedId = searchParams.get('id');

  const [items, setItems] = useState<LegalDocumentRow[]>([]);
  const [selected, setSelected] = useState<LegalDocumentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    legalApi
      .listDocuments(token, { page: 1, limit: 50 })
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(mapLegalError(String(err))))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    setDetailLoading(true);
    legalApi
      .getDocument(token, selectedId)
      .then(setSelected)
      .catch((err: unknown) => setError(mapLegalError(String(err))))
      .finally(() => setDetailLoading(false));
  }, [token, selectedId]);

  return (
    <div className="card-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1.2fr' }}>
      <div className="card">
        <h2>Документы</h2>
        <p className="muted" style={{ fontSize: '0.9rem' }}>
          LEGAL_REVIEW_REQUIRED — публикация только после проверки юристом.
        </p>
        {error && <p className="error-text">{error}</p>}
        {loading && <p>Загрузка…</p>}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Тип</th>
                <th>Версия</th>
                <th>Язык</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {items.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <Link href={`/legal/documents?id=${doc.id}`} className="text-link">
                      {legalDocumentTypeLabel(doc.type)}
                    </Link>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {doc.title}
                    </div>
                  </td>
                  <td>{doc.version}</td>
                  <td>{doc.locale}</td>
                  <td>
                    <span className={legalDocumentStatusClass(doc.status)}>
                      {legalDocumentStatusLabel(doc.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <p className="muted" style={{ padding: '1rem' }}>
              Документов нет. API: GET /api/v1/admin/legal/documents
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Просмотр</h2>
        {!selectedId && <p className="muted">Выберите документ в списке.</p>}
        {selectedId && detailLoading && <p>Загрузка…</p>}
        {selected && (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              {legalDocumentTypeLabel(selected.type)} v{selected.version} ({selected.locale})
              {selected.publishedAt ? ` · опубликован ${formatDateTime(selected.publishedAt)}` : ''}
            </p>
            <SafeReportText text={selected.content} emptyLabel="Пустой документ" />
          </>
        )}
      </div>
    </div>
  );
}
