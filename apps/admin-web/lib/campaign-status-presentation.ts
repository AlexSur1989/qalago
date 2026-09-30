import type { BackofficeStatusPresentation } from '@qalago/brand/status';
import { campaignStatusLabel } from './monetization-utils';

export function campaignStatusPresentation(status: string): BackofficeStatusPresentation {
  const label = campaignStatusLabel(status);
  switch (status) {
    case 'ACTIVE':
      return { label, tone: 'success' };
    case 'SCHEDULED':
      return { label, tone: 'info' };
    case 'PENDING_MODERATION':
      return { label, tone: 'warning' };
    case 'PAUSED':
      return { label, tone: 'neutral' };
    case 'COMPLETED':
      return { label, tone: 'info' };
    case 'CANCELLED':
      return { label, tone: 'danger' };
    default:
      return { label, tone: 'neutral' };
  }
}
