'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AuditLogRow } from '@/lib/api';
import { canViewAdminAuditLogs } from '@/lib/admin-catalog-rbac';
import { BackofficePageHeader } from '@/components/backoffice-page-header';
import { useAuth } from '@/lib/use-auth';
import {
  BackofficeEmptyState,
  BackofficeErrorState,
  BackofficeSkeleton,
} from '@qalago/brand/states';

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    TEAM_INVITE: 'Приглашение в команду',
    TEAM_INVITATION_ACCEPT: 'Принятие приглашения',
    TEAM_PERMISSION_UPDATE: 'Изменение прав',
    TEAM_SUSPEND: 'Приостановка доступа',
    TEAM_RESTORE: 'Восстановление доступа',
    TEAM_REVOKE: 'Отзыв доступа',
    USER_ROLE_CHANGE: 'Смена роли пользователя',
    PAYMENT_CONFIRM: 'Подтверждение оплаты',
    BUSINESS_PROFILE_UPDATE: 'Профиль заведения',
    PLAN_OVERRIDE: 'Изменение тарифа (админ)',
  };
  return labels[action] ?? action;
}

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
            <option value="USER_ROLE_CHANGE">Смена роли</option>
            <option value="PAYMENT_CONFIRM">Подтверждение оплаты</option>
            <option value="TEAM_INVITE">Приглашение в команду</option>
            <option value="TEAM_PERMISSION_UPDATE">Изменение прав команды</option>
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
                <td>{formatAction(row.action)}</td>
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
