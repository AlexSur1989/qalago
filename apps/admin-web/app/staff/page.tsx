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
  BackofficeSkeleton,
} from '@qalago/brand/states';
import {
  BackofficeTable,
  BackofficeTableBody,
  BackofficeTableCell,
  BackofficeTableContainer,
  BackofficeTableEmpty,
  BackofficeTableHead,
  BackofficeTableHeaderCell,
  BackofficeTableRow,
} from '@qalago/brand/tables';
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
      {loading && !error && !overview ? (
        <BackofficeLoadingState density="section" label="Загрузка…" />
      ) : null}
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
      {loading && !error ? <BackofficeSkeleton variant="table-row" count={4} /> : null}

      {!loading && !error && rows.length === 0 ? (
        <BackofficeTableEmpty emptyTitle="Staff-аккаунтов пока нет" icon="staff" />
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <BackofficeTableContainer>
          <BackofficeTable density="normal">
            <BackofficeTableHead>
              <tr>
                <BackofficeTableHeaderCell>Имя / телефон</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Роль</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Города</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell>Статус</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell variant="numeric">Сессии</BackofficeTableHeaderCell>
                <BackofficeTableHeaderCell variant="actions">Действия</BackofficeTableHeaderCell>
              </tr>
            </BackofficeTableHead>
            <BackofficeTableBody>
              {rows.map((row) => (
                <BackofficeTableRow key={row.id}>
                  <BackofficeTableCell>
                    {row.user.name ?? '—'}
                    <br />
                    <span className="muted">{row.user.phone ?? row.user.id}</span>
                  </BackofficeTableCell>
                  <BackofficeTableCell>
                    <BackofficeBadge
                      label={staffRoleLabel(row.staffRole)}
                      tone="info"
                      size="compact"
                    />
                  </BackofficeTableCell>
                  <BackofficeTableCell>
                    {row.cityScopes.map((c) => c.nameRu).join(', ') || '—'}
                  </BackofficeTableCell>
                  <BackofficeTableCell>
                    <BackofficeBadge {...staffActivePresentation(row.isActive)} size="compact" />
                  </BackofficeTableCell>
                  <BackofficeTableCell variant="numeric">{row.activeSessionCount}</BackofficeTableCell>
                  <BackofficeTableCell variant="actions">
                    <Link href={`/staff/${row.userId}`}>Детали</Link>
                  </BackofficeTableCell>
                </BackofficeTableRow>
              ))}
            </BackofficeTableBody>
          </BackofficeTable>
        </BackofficeTableContainer>
      ) : null}
    </div>
  );
}
