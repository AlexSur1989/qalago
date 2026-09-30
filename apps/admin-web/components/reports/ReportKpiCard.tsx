'use client';

import { BackofficeKpiCard, BackofficeKpiGrid } from '@qalago/brand/dashboards';
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
  let trend: { direction: 'up' | 'down' | 'flat'; text: string; neutral?: boolean } | undefined;
  if (isMetricSupported(value) && isMetricSupported(previousValue) && previousValue !== 0) {
    const abs = value - previousValue;
    const pct = (abs / previousValue) * 100;
    const dir = abs > 0 ? 'up' : abs < 0 ? 'down' : 'flat';
    trend = {
      direction: dir,
      text: formatPercent(Math.abs(pct)),
      neutral: neutralTrend,
    };
  }

  const display =
    isMetricSupported(value) && !loading
      ? formatValue
        ? formatValue(value)
        : formatValueDefault(value, format)
      : undefined;

  return (
    <BackofficeKpiCard
      label={label}
      value={display}
      loading={loading}
      error={!loading && !isMetricSupported(value) ? <ReportUnsupportedState /> : undefined}
      trend={trend}
      secondary={supportingText}
      icon="analytics"
    />
  );
}

export function ReportKpiGrid({ children }: { children: React.ReactNode }) {
  return <BackofficeKpiGrid>{children}</BackofficeKpiGrid>;
}
