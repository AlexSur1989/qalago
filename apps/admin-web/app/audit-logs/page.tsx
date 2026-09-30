'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AuditLogRow } from '@/lib/api';
import { canViewAdminAuditLogs } from '@/lib/admin-catalog-rbac';
import { BackofficePageHeader } from '@/components/backoffice-page-header';
import { useAuth } from '@/lib/use-auth';
import {
  auditActionFilterLabel,
  auditActionLabel,
} from '@/lib/audit-action-presentation';
import {
  BackofficeEmptyState,
  BackofficeErrorState,
  BackofficeSkeleton,
} from '@qalago/brand/states';

export default function AuditLogsPage() {
  const router = useRouter();
  const { token, user, ready } = useAuth();
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (!canViewAdminAuditLogs(user.role)) {
      router.replace('/dashboard');
    }
  }, [ready, token, user, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminApi
      .listAuditLogs(token, {
        page: 1,
        limit: 50,
        action: actionFilter || undefined,
      })
      .then((res) => setItems(res.items))
      .catch(() => setError('Не удалось загрузить журнал аудита'))
      .finally(() => setLoading(false));
  }, [token, actionFilter]);

  if (!ready || !user) return null;

  const description =
    user.role === 'CITY_ADMIN'
      ? 'Записи только по вашему городу'
      : 'Все операционные изменения платформы';

  return (
    <>
      <BackofficePageHeader title="Журнал аудита" description={description} />

      <div className="toolbar table-toolbar">
        <label>
          Действие{' '}
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">Все</option>
            <option value="USER_ROLE_CHANGE">{auditActionFilterLabel('USER_ROLE_CHANGE')}</option>
            <option value="PAYMENT_CONFIRM">{auditActionFilterLabel('PAYMENT_CONFIRM')}</option>
            <option value="TEAM_INVITE">{auditActionFilterLabel('TEAM_INVITE')}</option>
            <option value="TEAM_PERMISSION_UPDATE">
              {auditActionFilterLabel('TEAM_PERMISSION_UPDATE')}
            </option>
          </select>
        </label>
      </div>

      {error ? (
        <BackofficeErrorState
          title="Не удалось загрузить журнал аудита"
          message={error}
          onRetry={() => {
            if (!token) return;
            setError(null);
            setLoading(true);
            adminApi
              .listAuditLogs(token, {
                page: 1,
                limit: 50,
                action: actionFilter || undefined,
              })
              .then((res) => setItems(res.items))
              .catch(() => setError('Не удалось загрузить журнал аудита'))
              .finally(() => setLoading(false));
          }}
        />
      ) : null}

      {loading ? <BackofficeSkeleton variant="table-row" count={6} /> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Время</th>
              <th>Актор</th>
              <th>Действие</th>
              <th>Ресурс</th>
              <th>Заведение / город</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.createdAt).toLocaleString('ru-RU')}</td>
                <td>
                  {row.actor?.name ?? row.actor?.phone ?? '—'}
                  {row.actor?.role ? ` (${row.actor.role})` : ''}
                </td>
                <td>{auditActionLabel(row.action)}</td>
                <td>
                  {row.resourceType}
                  {row.resourceId ? ` · ${row.resourceId.slice(0, 8)}…` : ''}
                </td>
                <td>
                  {row.business?.title ?? '—'}
                  {row.city?.nameRu ? ` · ${row.city.nameRu}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !error && items.length === 0 ? (
          <BackofficeEmptyState
            title="Записей пока нет"
            description="Аудит ведётся с момента включения Stage 5M.3."
            icon="audit"
            density="section"
          />
        ) : null}
      </div>
    </>
  );
}
