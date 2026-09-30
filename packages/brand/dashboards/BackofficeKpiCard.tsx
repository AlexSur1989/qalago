'use client';

import type { ReactNode } from 'react';
import { QalaIcon } from '../icons';
import type { QalaBackofficeIconName } from '../icons/types';

export type BackofficeKpiTrend = {
  direction: 'up' | 'down' | 'flat';
  text: string;
  neutral?: boolean;
};

export type BackofficeKpiCardProps = {
  label: string;
  value?: ReactNode;
  unit?: string;
  secondary?: ReactNode;
  trend?: BackofficeKpiTrend;
  icon?: QalaBackofficeIconName;
  href?: string;
  linkLabel?: string;
  loading?: boolean;
  error?: ReactNode;
  emptyLabel?: string;
  className?: string;
};

export function BackofficeKpiCard({
  label,
  value,
  unit,
  secondary,
  trend,
  icon,
  href,
  linkLabel,
  loading,
  error,
  emptyLabel,
  className,
}: BackofficeKpiCardProps) {
  const body = (
    <>
      {icon ? (
        <span style={{ position: 'absolute', top: 12, right: 12, opacity: 0.35 }} aria-hidden>
          <QalaIcon name={icon} size="sm" decorative />
        </span>
      ) : null}
      {loading ? (
        <>
          <div className="bo-kpi-skel-value" />
          <div className="bo-kpi-skel-label" />
        </>
      ) : error ? (
        <>
          <div className="bo-kpi-value" aria-hidden>
            —
          </div>
          <div className="bo-kpi-label">{label}</div>
          <div className="bo-kpi-secondary" role="alert">
            {error}
          </div>
        </>
      ) : (
        <>
          <div className="bo-kpi-value">
            {value ?? emptyLabel ?? '—'}
            {unit ? <span style={{ fontSize: '0.65em', fontWeight: 600, marginLeft: 4 }}>{unit}</span> : null}
          </div>
          <div className="bo-kpi-label">{label}</div>
          {secondary ? <div className="bo-kpi-secondary">{secondary}</div> : null}
          {trend ? (
            <div
              className={`bo-kpi-trend bo-kpi-trend--${trend.neutral ? 'neutral' : trend.direction}`}
              title={trend.text}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.text}
            </div>
          ) : null}
          {href && linkLabel ? <span className="bo-kpi-link">{linkLabel}</span> : null}
        </>
      )}
    </>
  );

  const classNames = [
    'bo-kpi-card',
    loading ? 'bo-kpi-card--loading' : '',
    error ? 'bo-kpi-card--error' : '',
    href && !loading && !error ? 'bo-kpi-card--link' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  if (href && !loading && !error) {
    return (
      <a href={href} className={classNames} style={{ position: 'relative' }}>
        {body}
      </a>
    );
  }

  return (
    <article className={classNames} style={{ position: 'relative' }}>
      {body}
    </article>
  );
}

export function BackofficeKpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`bo-kpi-grid${className ? ` ${className}` : ''}`}>{children}</div>;
}
