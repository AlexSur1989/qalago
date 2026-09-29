import {
  BusinessPermission,
  type BusinessAccessContext,
  hasPermission,
  isOwner,
} from '@/lib/business-access';

/** BIZ.3-aligned route gate — mirrors sidebar nav contract (BIZ.9 HOTFIX 4). */
export type BusinessRouteAccessRequirement =
  | { kind: 'cabinet' }
  | { kind: 'ownerOnly' }
  | { kind: 'anyOf'; permissions: BusinessPermission[] };

export const BUSINESS_ROUTE_ACCESS = {
  cabinet: { kind: 'cabinet' } as const,
  ownerOnly: { kind: 'ownerOnly' } as const,
  businessProfile: {
    kind: 'anyOf',
    permissions: [BusinessPermission.BUSINESS_PROFILE_EDIT, BusinessPermission.BUSINESS_HOURS_EDIT],
  } as const,
  catalog: { kind: 'anyOf', permissions: [BusinessPermission.CATALOG_EDIT] } as const,
  photos: { kind: 'anyOf', permissions: [BusinessPermission.PHOTOS_EDIT] } as const,
  promotions: { kind: 'anyOf', permissions: [BusinessPermission.PROMOTIONS_EDIT] } as const,
  reviews: { kind: 'anyOf', permissions: [BusinessPermission.REVIEWS_REPLY] } as const,
  analytics: { kind: 'anyOf', permissions: [BusinessPermission.ANALYTICS_VIEW] } as const,
  payments: { kind: 'anyOf', permissions: [BusinessPermission.PAYMENTS_VIEW] } as const,
  ads: { kind: 'anyOf', permissions: [BusinessPermission.ADS_MANAGE] } as const,
  settings: { kind: 'anyOf', permissions: [BusinessPermission.BUSINESS_PROFILE_EDIT] } as const,
} satisfies Record<string, BusinessRouteAccessRequirement>;

export function canAccessBusinessRoute(
  access: BusinessAccessContext | null | undefined,
  requirement: BusinessRouteAccessRequirement,
): boolean {
  if (!access) return false;
  if (requirement.kind === 'cabinet') return true;
  if (requirement.kind === 'ownerOnly') return isOwner(access);
  return requirement.permissions.some((p) => hasPermission(access, p));
}

export function isBusinessRouteContentAllowed(
  ready: boolean,
  access: BusinessAccessContext | null | undefined,
  requirement: BusinessRouteAccessRequirement,
  hasBusiness: boolean,
): boolean {
  if (!ready || !hasBusiness) return false;
  return canAccessBusinessRoute(access, requirement);
}
