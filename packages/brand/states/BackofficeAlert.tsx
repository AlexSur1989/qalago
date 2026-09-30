'use client';

import type { ReactNode } from 'react';
import { QalaIcon } from '../icons';
import { alertVariantIcon } from './state-icons';
import type { BackofficeAlertVariant } from './types';

const ALERT_CLASS: Record<BackofficeAlertVariant, string> = {
  success: 'alert alert-success',
  warning: 'alert alert-warning',
  danger: 'alert alert-error',
  info: 'alert alert-info',
  neutral: 'alert',
};

const ALERT_ROLE: Record<BackofficeAlertVariant, 'alert' | 'status'> = {
  success: 'status',
  warning: 'status',
  danger: 'alert',
  info: 'status',
  neutral: 'status',
};

export type BackofficeAlertProps = {
  variant?: BackofficeAlertVariant;
  title?: string;
  message?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  showIcon?: boolean;
};

export function BackofficeAlert({
  variant = 'neutral',
  title,
  message,
  children,
  actions,
  className,
  showIcon = true,
}: BackofficeAlertProps) {
  const body = children ?? message;
  const iconName = showIcon ? alertVariantIcon(variant) : null;

  return (
    <div
      className={`bo-alert ${ALERT_CLASS[variant]}${className ? ` ${className}` : ''}`}
      role={ALERT_ROLE[variant]}
    >
      {iconName ? (
        <span className="bo-alert-icon" aria-hidden>
          <QalaIcon name={iconName} size="md" decorative />
        </span>
      ) : null}
      <div className="bo-alert-body">
        {title ? <p className="bo-alert-title">{title}</p> : null}
        {body ? <div className="bo-alert-message">{body}</div> : null}
        {actions ? <div className="bo-alert-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

export function BackofficeSuccessState(props: Omit<BackofficeAlertProps, 'variant'>) {
  return <BackofficeAlert variant="success" {...props} />;
}
