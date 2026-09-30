import type { BackofficeStatusPresentation } from '@qalago/brand/status';
import { claimStatusLabel } from './business-requests-utils';

export function claimStatusPresentation(status: string): BackofficeStatusPresentation {
  const label = claimStatusLabel(status);
  switch (status) {
    case 'APPROVED':
      return { label, tone: 'success' };
    case 'REJECTED':
    case 'CANCELLED':
      return { label, tone: 'danger' };
    case 'PENDING':
      return { label, tone: 'warning' };
    default:
      return { label, tone: 'neutral' };
  }
}
