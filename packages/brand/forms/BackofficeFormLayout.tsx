'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export type BackofficeFormSectionProps = {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function BackofficeFormSection({ title, description, children, className }: BackofficeFormSectionProps) {
  return (
    <section className={`bo-form-section${className ? ` ${className}` : ''}`}>
      {title ? <h3 className="bo-form-section-title">{title}</h3> : null}
      {description ? <p className="bo-form-section-description">{description}</p> : null}
      {children}
    </section>
  );
}

export type BackofficeFormActionsProps = {
  children: ReactNode;
  className?: string;
};

export function BackofficeFormActions({ children, className }: BackofficeFormActionsProps) {
  return <div className={`bo-form-actions${className ? ` ${className}` : ''}`}>{children}</div>;
}

export type BackofficeFieldGroupProps = HTMLAttributes<HTMLDivElement> & {
  columns?: 1 | 2 | 'inline';
};

export function BackofficeFieldGroup({ columns = 1, className, ...props }: BackofficeFieldGroupProps) {
  const colClass =
    columns === 2 ? 'bo-form-grid--2' : columns === 'inline' ? 'bo-form-grid--inline' : 'bo-form-grid--1';
  return <div className={`bo-form-grid ${colClass}${className ? ` ${className}` : ''}`} {...props} />;
}

export type BackofficeUploadSurfaceProps = {
  hint: ReactNode;
  busy?: boolean;
  children?: ReactNode;
};

export function BackofficeUploadSurface({ hint, busy, children }: BackofficeUploadSurfaceProps) {
  return (
    <div className={`bo-upload-surface${busy ? ' bo-upload-surface--busy' : ''}`}>
      {children}
      <p style={{ margin: children ? '8px 0 0' : 0 }}>{hint}</p>
    </div>
  );
}
