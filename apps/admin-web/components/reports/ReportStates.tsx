'use client';

import {
  BackofficeAccessDenied,
  BackofficeEmptyState,
  BackofficeErrorState,
  BackofficeSkeleton,
} from '@qalago/brand/states';

export function ReportSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true">
      <BackofficeSkeleton variant="table-row" count={rows} />
    </div>
  );
}

export function ReportErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <BackofficeErrorState
      title="Не удалось загрузить отчёт"
      message={message}
      onRetry={onRetry}
      retryLabel="Повторить"
    />
  );
}

export function ReportForbiddenState() {
  return (
    <BackofficeAccessDenied
      title="Доступ запрещён"
      description="У вашей роли нет прав на этот отчёт."
    />
  );
}

export function ReportEmptyState({ title, hint }: { title: string; hint?: string }) {
  return <BackofficeEmptyState title={title} description={hint} icon="analytics" density="section" />;
}

export function ReportUnsupportedState({ label = 'Метрика пока недоступна' }: { label?: string }) {
  return <span className="report-unsupported">{label}</span>;
}
