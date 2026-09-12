'use client';

import { formatCount, formatPercent, isMetricSupported } from '@/lib/reporting/format';
import { ReportUnsupportedState } from './ReportStates';

export type ReportKpiCardProps = {
  label: string;
  value: number | null | undefined;
  previousValue?: number | null;
  format?: 'count' | 'percent' | 'kzt';
  supportingText?: string;
  loading?: boolean;
  neutralTrend?: boolean;
  formatValue?: (v: number) => string;
};

function formatValueDefault(v: number, format: ReportKpiCardProps['format']) {
  if (format === 'percent') return formatPercent(v);
  if (format === 'kzt') return `${v.toLocaleString('ru-RU')} ₸`;
  return formatCount(v);
}

export function ReportKpiCard({
  label,
  value,
  previousValue,
  format = 'count',
  supportingText,
  loading,
  neutralTrend = false,
  formatValue,
}: ReportKpiCardProps) {
  if (loading) {
    return (
      <div className="report-kpi-card report-kpi-card-loading">
        <div className="report-kpi-skel-label" />
        <div className="report-kpi-skel-value" />
      </div>
    );
  }

  let change: { abs: number; pct: number | null; dir: 'up' | 'down' | 'flat' } | null = null;
  if (isMetricSupported(value) && isMetricSupported(previousValue) && previousValue !== 0) {
    const abs = value - previousValue;
    const pct = (abs / previousValue) * 100;
    change = { abs, pct, dir: abs > 0 ? 'up' : abs < 0 ? 'down' : 'flat' };
  }

  return (
    <div className="report-kpi-card">
      <div className="report-kpi-label">{label}</div>
      <div className="report-kpi-value">
        {isMetricSupported(value) ? (
          formatValue ? formatValue(value) : formatValueDefault(value, format)
        ) : (
          <ReportUnsupportedState />
        )}
      </div>
      {change && change.pct != null ? (
        <div
          className={`report-kpi-change${neutralTrend ? ' report-kpi-change-neutral' : ''}`}
          title="Изменение к предыдущему периоду"
        >
          {change.dir === 'up' ? '↑' : change.dir === 'down' ? '↓' : '→'}{' '}
          {formatPercent(Math.abs(change.pct))}
        </div>
      ) : null}
      {supportingText ? <div className="report-kpi-meta muted">{supportingText}</div> : null}
    </div>
  );
}

export function ReportKpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="report-kpi-grid">{children}</div>;
}
