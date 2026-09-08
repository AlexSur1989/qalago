'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, AuditLogRow } from '@/lib/api';
import { canModerate } from '@/lib/rbac';
import { useAuth } from '@/lib/use-auth';

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
    if (!canModerate(user.role)) {
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
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [token, actionFilter]);

  if (!ready || !user) return null;

  return (
    <div className="shell" style={{ minHeight: '100vh' }}>
      <header className="topbar" style={{ padding: '1rem 1.5rem' }}>
        <div>
          <Link href="/dashboard" className="text-link">
            ← Панель
          </Link>
          <h1 style={{ margin: '0.5rem 0 0' }}>Журнал аудита</h1>
          <p className="muted" style={{ margin: 0 }}>
            {user.role === 'CITY_ADMIN'
              ? 'Записи только по вашему городу'
              : 'Все операционные изменения платформы'}
          </p>
        </div>
      </header>

      <main style={{ padding: '1rem 1.5rem 2rem' }}>
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
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

        {error && <p className="error-text">{error}</p>}
        {loading && <p>Загрузка…</p>}

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
          {!loading && items.length === 0 && (
            <p className="muted" style={{ padding: '1rem' }}>
              Записей пока нет. Аудит ведётся с момента включения Stage 5M.3.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
