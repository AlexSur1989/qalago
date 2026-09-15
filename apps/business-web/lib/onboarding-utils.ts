import type { AppLocale } from '@/lib/locale';
import * as pres from '@/lib/presentation';

export type ApplicationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export const applicationStatusLabel = pres.applicationStatusLabel;
export const claimStatusLabel = pres.claimStatusLabel;
export const membershipRoleLabel = pres.membershipRoleLabel;

export function mapOnboardingError(locale: AppLocale, raw: string): string {
  return pres.mapOnboardingErrorMessage(locale, raw);
}
