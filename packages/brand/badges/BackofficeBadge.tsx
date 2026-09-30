'use client';

import { QalaIcon } from '../icons';
import type { QalaBackofficeIconName } from '../icons/types';
import type { BackofficeStatusTone } from '../status/types';

export type BackofficeBadgeSize = 'compact' | 'default';

export type BackofficeBadgeProps = {
  label: string;
  tone?: BackofficeStatusTone;
  icon?: QalaBackofficeIconName;
  size?: BackofficeBadgeSize;
  className?: string;
};

export function BackofficeBadge({
  label,
  tone = 'neutral',
  icon,
  size = 'default',
  className,
}: BackofficeBadgeProps) {
  return (
    <span
      className={`bo-badge bo-badge--${tone} bo-badge--${size}${className ? ` ${className}` : ''}`}
    >
      {icon ? (
        <span className="bo-badge-icon" aria-hidden>
          <QalaIcon name={icon} size="sm" decorative />
        </span>
      ) : null}
      <span className="bo-badge-label">{label}</span>
    </span>
  );
}

/** Map tone to legacy tag class for gradual migration. */
export function backofficeToneToTagClass(tone: BackofficeStatusTone): string {
  switch (tone) {
    case 'success':
      return 'tag tag-success';
    case 'warning':
      return 'tag tag-warning';
    case 'danger':
      return 'tag tag-danger';
    case 'info':
      return 'tag tag-warning';
    default:
      return 'tag tag-muted';
  }
}
