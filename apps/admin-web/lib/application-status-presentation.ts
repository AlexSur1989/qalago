import type { BackofficeStatusPresentation } from '@qalago/brand/status';
import { applicationStatusLabel } from './business-requests-utils';

export function applicationStatusPresentation(status: string): BackofficeStatusPresentation {
  const label = applicationStatusLabel(status);
  switch (status) {
    case 'APPROVED':
      return { label, tone: 'success' };
    case 'REJECTED':
    case 'CANCELLED':
      return { label, tone: 'danger' };
    case 'PENDING':
      return { label, tone: 'warning' };
    case 'DRAFT':
      return { label, tone: 'neutral' };
    default:
      return { label, tone: 'neutral' };
  }
}
