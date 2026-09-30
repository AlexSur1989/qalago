'use client';

import type { ReactNode } from 'react';
import { BackofficeBadge } from '../badges';

export type BackofficeBranchCardProps = {
  cityLabel: string;
  address: string;
  isPrimary?: boolean;
  primaryBadgeLabel: string;
  phone?: string | null;
  hoursSummary?: string | null;
  hoursSummaryLabel?: string;
  secondaryHint?: string | null;
  contactLine?: string | null;
  actions?: ReactNode;
};

export function BackofficeBranchCard({
  cityLabel,
  address,
  isPrimary,
  primaryBadgeLabel,
  phone,
  hoursSummary,
  hoursSummaryLabel,
  secondaryHint,
  contactLine,
  actions,
}: BackofficeBranchCardProps) {
  return (
    <article className="bo-branch-card">
      <div className="bo-branch-card__header">
        <span className="bo-branch-card__city">{cityLabel}</span>
        {isPrimary ? (
          <BackofficeBadge label={primaryBadgeLabel} tone="success" size="compact" />
        ) : null}
      </div>
      <p className="bo-branch-card__address">{address}</p>
      {phone ? <p className="bo-branch-card__meta">{phone}</p> : null}
      {contactLine ? <p className="bo-branch-card__meta">{contactLine}</p> : null}
      {hoursSummary && hoursSummaryLabel ? (
        <p className="bo-branch-card__meta">
          {hoursSummaryLabel}: {hoursSummary}
        </p>
      ) : null}
      {secondaryHint && !isPrimary ? <p className="bo-branch-card__meta">{secondaryHint}</p> : null}
      {actions ? <div className="bo-branch-card__actions">{actions}</div> : null}
    </article>
  );
}
