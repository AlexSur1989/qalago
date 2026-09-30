import type { BackofficeStatusPresentation } from '@qalago/brand/status';
import { moderationCaseStatusLabel } from './moderation-utils';

export function moderationCaseStatusPresentation(status: string): BackofficeStatusPresentation {
  const label = moderationCaseStatusLabel(status);
  switch (status) {
    case 'OPEN':
    case 'ACTION_REQUIRED':
      return { label, tone: 'warning' };
    case 'IN_REVIEW':
      return { label, tone: 'info' };
    case 'RESOLVED':
      return { label, tone: 'success' };
    case 'DISMISSED':
      return { label, tone: 'neutral' };
    default:
      return { label, tone: 'neutral' };
  }
}
