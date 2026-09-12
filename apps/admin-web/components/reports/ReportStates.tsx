'use client';

export function ReportSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="report-skeleton" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="report-skeleton-row" />
      ))}
    </div>
  );
}

export function ReportErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="report-state report-state-error">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
          Повторить
        </button>
      ) : null}
    </div>
  );
}

export function ReportForbiddenState() {
  return (
    <div className="report-state report-state-forbidden">
      <h2>Доступ запрещён</h2>
      <p>У вашей роли нет прав на этот отчёт.</p>
    </div>
  );
}

export function ReportEmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="report-state report-state-empty">
      <p>{title}</p>
      {hint ? <p className="muted">{hint}</p> : null}
    </div>
  );
}

export function ReportUnsupportedState({ label = 'Метрика пока недоступна' }: { label?: string }) {
  return <span className="report-unsupported">{label}</span>;
}
