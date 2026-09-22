import type { ModerationMediaTarget } from './moderation-api';
import {
  businessImageScopeLabel,
  type StaffMediaLocale,
} from './staff-media-labels';

export function moderationMediaScopeLabel(
  mediaTarget: ModerationMediaTarget | undefined,
  locale: StaffMediaLocale = 'ru',
): string {
  if (!mediaTarget?.available) {
    return '—';
  }
  return businessImageScopeLabel(
    {
      locationId: mediaTarget.locationId,
      branchUnavailable: mediaTarget.branchUnavailable,
      branch: mediaTarget.branch
        ? {
            address: mediaTarget.branch.address,
            isPrimary: mediaTarget.branch.isPrimary,
            city: mediaTarget.branch.city,
          }
        : null,
    },
    locale,
  );
}

/** Moderation actions must keep targeting the case targetId (BusinessImage.id). */
export function moderationMediaActionTargetId(caseTargetId: string): string {
  return caseTargetId;
}
