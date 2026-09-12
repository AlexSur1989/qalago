'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/use-auth';
import { staffApi, StaffListRow, StaffOverview } from '@/lib/staff-api';
import { isSuperAdminRole } from '@/lib/rbac';

export default function StaffPage() {
  const { token, user, ready } = useAuth();
  const [rows, setRows] = useState<StaffListRow[]>([]);
  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user || !isSuperAdminRole(user.role)) return;
    Promise.all([staffApi.list(token), staffApi.overview(token)])
      .then(([list, ov]) => {
        setRows(list);
        setOverview(ov);
      })
      .catch(() => setError('Не удалось загрузить staff'));
  }, [token, user]);

  if (!ready) return <p className="muted">Загрузка…</p>;
  if (!user || !isSuperAdminRole(user.role)) {
    return <p className="tag tag-danger">Доступ только для SUPER_ADMIN</p>;
  }

  return (
    <div className="page-stack">
      <h1>Staff / RBAC</h1>
      {error ? <p className="tag tag-danger">{error}</p> : null}
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
              <td>{row.staffRole}</td>
              <td>{row.cityScopes.map((c) => c.nameRu).join(', ') || '—'}</td>
              <td>{row.isActive ? 'Активен' : 'Отключён'}</td>
              <td>{row.activeSessionCount}</td>
              <td>
                <Link href={`/staff/${row.userId}`}>Детали</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
