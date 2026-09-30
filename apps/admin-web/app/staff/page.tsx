'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BackofficePageHeader } from '@/components/backoffice-page-header';
import { useAuth } from '@/lib/use-auth';
import { staffApi, StaffListRow, StaffOverview } from '@/lib/staff-api';
import { isSuperAdminRole } from '@/lib/rbac';
import { BackofficeBadge } from '@qalago/brand/badges';
import {
  BackofficeAccessDenied,
  BackofficeErrorState,
  BackofficeLoadingState,
} from '@qalago/brand/states';
import { staffActivePresentation, staffRoleLabel } from '@/lib/staff-presentation';

export default function StaffPage() {
  const { token, user, ready } = useAuth();
  const [rows, setRows] = useState<StaffListRow[]>([]);
  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function loadStaff() {
    if (!token || !user || !isSuperAdminRole(user.role)) return;
    setLoading(true);
    setError(null);
    Promise.all([staffApi.list(token), staffApi.overview(token)])
      .then(([list, ov]) => {
        setRows(list);
        setOverview(ov);
      })
      .catch(() => setError('Не удалось загрузить список staff'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when auth ready
  }, [token, user?.role]);

  if (!ready) return <BackofficeLoadingState density="page" label="Загрузка…" />;
  if (!user || !isSuperAdminRole(user.role)) {
    return (
      <BackofficeAccessDenied
        title="Доступ только для SUPER_ADMIN"
        description="Раздел Staff / RBAC доступен только суперадминистратору."
      />
    );
  }

  return (
    <div className="shell-page-body">
      <BackofficePageHeader
        title="Staff / RBAC"
        description="Управление учётными записями staff и ролями платформы."
      />
      {error ? (
        <BackofficeErrorState
          title="Не удалось загрузить staff"
          message={error}
          onRetry={loadStaff}
          retrying={loading}
        />
      ) : null}
      {loading && !error ? <BackofficeLoadingState density="section" label="Загрузка…" /> : null}
      {overview ? (
        <div className="card-grid">
          <div className="card">
            <div className="card-title">Всего staff</div>
            <div className="card-value">{overview.total}</div>
          </div>
          <div className="card">
            <div className="card-title">Активных</div>
            <div className="card-value">{overview.active}</div>
          </div>
          <div className="card">
            <div className="card-title">Отключённых</div>
            <div className="card-value">{overview.disabled}</div>
          </div>
        </div>
      ) : null}
      {!loading && !error ? (
      <table className="data-table">
        <thead>
          <tr>
            <th>Имя / телефон</th>
            <th>Роль</th>
            <th>Города</th>
            <th>Статус</th>
            <th>Сессии</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                {row.user.name ?? '—'}
                <br />
                <span className="muted">{row.user.phone ?? row.user.id}</span>
              </td>
              <td>
                <BackofficeBadge
                  label={staffRoleLabel(row.staffRole)}
                  tone="info"
                  size="compact"
                />
              </td>
              <td>{row.cityScopes.map((c) => c.nameRu).join(', ') || '—'}</td>
              <td>
                <BackofficeBadge
                  {...staffActivePresentation(row.isActive)}
                  size="compact"
                />
              </td>
              <td>{row.activeSessionCount}</td>
              <td>
                <Link href={`/staff/${row.userId}`}>Детали</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      ) : null}
    </div>
  );
}
