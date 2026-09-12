'use client';

import { ReactNode } from 'react';
import { StaffPermission, staffRoleHasPermission, UserRole } from '@qalago/shared-types';
import type { AuthUser, CityRow } from '@/lib/api';
import { ReportFilterBar } from './ReportFilterBar';
import {
  ReportErrorState,
  ReportForbiddenState,
  ReportSkeleton,
} from './ReportStates';
import type { ReportQueryParams } from '@/lib/reporting/filters';
import { ReportExportButton } from './ReportExportButton';

type ReportPageShellProps = {
  title: string;
  description: string;
  user: AuthUser | null;
  allowed: boolean;
  ready: boolean;
  loading: boolean;
  error: string | null;
  forbidden: boolean;
  validationError: string | null;
  params: ReportQueryParams;
  setParams: (p: Partial<ReportQueryParams>) => void;
  refresh: () => void;
  updatedAt: Date | null;
  cities?: CityRow[];
  filterOptions?: {
    showCity?: boolean;
    showCategory?: boolean;
    showPlacement?: boolean;
    showPlan?: boolean;
  };
  exportReportKey?: string;
  token?: string | null;
  children: ReactNode;
};

export function ReportPageShell({
  title,
  description,
  user,
  allowed,
  ready,
  loading,
  error,
  forbidden,
  validationError,
  params,
  setParams,
  refresh,
  updatedAt,
  cities,
  filterOptions,
  exportReportKey,
  token,
  children,
}: ReportPageShellProps) {
  if (!ready) return <ReportSkeleton rows={4} />;
  if (!user || !allowed) return <ReportForbiddenState />;
  if (forbidden) return <ReportForbiddenState />;

  const canExport =
    exportReportKey &&
    token &&
    staffRoleHasPermission(user.role as UserRole, StaffPermission.REPORT_EXPORT);

  return (
    <div className="report-page">
      <header className="report-page-header">
        <div>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
        </div>
        <div className="report-page-actions">
          {updatedAt ? (
            <span className="muted report-updated">
              Обновлено: {updatedAt.toLocaleTimeString('ru-RU')}
            </span>
          ) : null}
          <button type="button" className="btn btn-sm" onClick={() => refresh()} disabled={loading}>
            Обновить
          </button>
          {canExport ? (
            <ReportExportButton token={token} reportKey={exportReportKey} params={params} />
          ) : null}
        </div>
      </header>

      <ReportFilterBar
        user={user}
        params={params}
        onChange={setParams}
        validationError={validationError}
        cities={cities}
        {...filterOptions}
      />

      {validationError ? (
        <ReportErrorState message={validationError} />
      ) : error ? (
        <ReportErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <>
          <ReportSkeleton rows={2} />
          {children}
        </>
      ) : (
        children
      )}
    </div>
  );
}
