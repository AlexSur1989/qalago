import type { AppLocale } from '@/lib/locale';
import {
  businessPermissionLabel,
  membershipRoleLabel,
  membershipStatusLabel,
  navLabelForId,
  paymentsAccessDeniedMessage,
  permissionPresets,
} from '@/lib/presentation';

/** Business-scoped capabilities (mirrors backend BusinessPermission enum). */
export enum BusinessPermission {
  BUSINESS_PROFILE_EDIT = 'BUSINESS_PROFILE_EDIT',
  BUSINESS_HOURS_EDIT = 'BUSINESS_HOURS_EDIT',
  CATALOG_EDIT = 'CATALOG_EDIT',
  PHOTOS_EDIT = 'PHOTOS_EDIT',
  PROMOTIONS_EDIT = 'PROMOTIONS_EDIT',
  REVIEWS_REPLY = 'REVIEWS_REPLY',
  ANALYTICS_VIEW = 'ANALYTICS_VIEW',
  ANALYTICS_EXPORT = 'ANALYTICS_EXPORT',
  ADS_MANAGE = 'ADS_MANAGE',
  PAYMENTS_VIEW = 'PAYMENTS_VIEW',
}

export const ALL_BUSINESS_PERMISSIONS = Object.values(BusinessPermission);

export function businessPermissionLabelForLocale(
  locale: AppLocale,
  permission: BusinessPermission,
): string {
  return businessPermissionLabel(locale, permission);
}

export type BusinessAccessRole = 'OWNER' | 'MANAGER';

export type BusinessAccessContext = {
  role: BusinessAccessRole;
  permissions: string[];
};

export type NavId =
  | 'home'
  | 'profile'
  | 'menu'
  | 'promotions'
  | 'stats'
  | 'messages'
  | 'settings'
  | 'plan'
  | 'monetization'
  | 'help'
  | 'media'
  | 'reviews'
  | 'team';

export type BusinessNavItem = {
  id: NavId;
  label: string;
  icon: string;
  href?: (businessId: string) => string;
  soon?: boolean;
  anyOf?: BusinessPermission[];
  ownerOnly?: boolean;
};

const MAIN_NAV_TEMPLATE: Omit<BusinessNavItem, 'label'>[] = [
  { id: 'home', icon: '🏠', href: () => '/dashboard' },
  {
    id: 'profile',
    icon: '🏪',
    href: (id) => `/business/${id}`,
    anyOf: [BusinessPermission.BUSINESS_PROFILE_EDIT, BusinessPermission.BUSINESS_HOURS_EDIT],
  },
  {
    id: 'media',
    icon: '🖼️',
    href: (id) => `/business/${id}/media`,
    anyOf: [BusinessPermission.PHOTOS_EDIT],
  },
  {
    id: 'menu',
    icon: '📋',
    href: (id) => `/business/${id}/menu`,
    anyOf: [BusinessPermission.CATALOG_EDIT],
  },
  {
    id: 'promotions',
    icon: '🏷️',
    href: (id) => `/business/${id}/promotions`,
    anyOf: [BusinessPermission.PROMOTIONS_EDIT],
  },
  {
    id: 'reviews',
    icon: '💬',
    href: (id) => `/business/${id}/reviews`,
    anyOf: [BusinessPermission.REVIEWS_REPLY],
  },
  {
    id: 'monetization',
    icon: '📣',
    href: () => '/monetization',
    anyOf: [BusinessPermission.ADS_MANAGE],
  },
  {
    id: 'stats',
    icon: '📊',
    href: () => '/statistics',
    anyOf: [BusinessPermission.ANALYTICS_VIEW],
  },
  {
    id: 'settings',
    icon: '⚙️',
    href: () => '/settings',
    anyOf: [BusinessPermission.BUSINESS_PROFILE_EDIT],
  },
  {
    id: 'team',
    icon: '👥',
    href: (id) => `/business/${id}/team`,
    ownerOnly: true,
  },
];

const FOOTER_NAV_TEMPLATE: Omit<BusinessNavItem, 'label'>[] = [
  {
    id: 'plan',
    icon: '💎',
    href: () => '/plan',
    anyOf: [BusinessPermission.PAYMENTS_VIEW],
  },
  { id: 'help', icon: '❓', href: () => '/help' },
];

export type PermissionPreset = {
  id: string;
  label: string;
  description?: string;
  permissions: BusinessPermission[];
};

export function buildPermissionPresets(locale: AppLocale): PermissionPreset[] {
  return permissionPresets(locale).map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    permissions: p.permissions as BusinessPermission[],
  }));
}

/** @deprecated use buildPermissionPresets(locale) */
export const PERMISSION_PRESETS: PermissionPreset[] = buildPermissionPresets('ru');

export function paymentsAccessDeniedMessageForLocale(locale: AppLocale): string {
  return paymentsAccessDeniedMessage(locale);
}

/** @deprecated use paymentsAccessDeniedMessageForLocale */
export const PAYMENTS_ACCESS_DENIED_RU = paymentsAccessDeniedMessage('ru');

export function isOwner(access: BusinessAccessContext | null | undefined): boolean {
  return access?.role === 'OWNER';
}

export function canViewPayments(access: BusinessAccessContext | null | undefined): boolean {
  return hasPermission(access, BusinessPermission.PAYMENTS_VIEW);
}

export function hasPermission(
  access: BusinessAccessContext | null | undefined,
  permission: BusinessPermission | string,
): boolean {
  if (!access) return false;
  if (isOwner(access)) return true;
  return access.permissions.includes(permission);
}

export function canAccessNavItem(
  item: Pick<BusinessNavItem, 'anyOf' | 'ownerOnly'>,
  access: BusinessAccessContext | null | undefined,
): boolean {
  if (!access) {
    return !item.ownerOnly && (!item.anyOf || item.anyOf.length === 0);
  }
  if (item.ownerOnly && !isOwner(access)) return false;
  if (isOwner(access)) return true;
  if (!item.anyOf || item.anyOf.length === 0) return true;
  return item.anyOf.some((p) => hasPermission(access, p));
}

export function filterNavByAccess<T extends Pick<BusinessNavItem, 'id' | 'anyOf' | 'ownerOnly'>>(
  items: T[],
  access: BusinessAccessContext | null | undefined,
): T[] {
  return items.filter((item) => canAccessNavItem(item, access));
}

export function buildMainNavItems(locale: AppLocale): BusinessNavItem[] {
  return MAIN_NAV_TEMPLATE.map((item) => ({
    ...item,
    label: navLabelForId(locale, item.id),
  }));
}

export function buildFooterNavItems(locale: AppLocale): BusinessNavItem[] {
  return FOOTER_NAV_TEMPLATE.map((item) => ({
    ...item,
    label: navLabelForId(locale, item.id),
  }));
}

export function normalizeSelectedPermissions(permissions: BusinessPermission[]): BusinessPermission[] {
  const set = new Set(permissions);
  if (set.has(BusinessPermission.ANALYTICS_EXPORT)) {
    set.add(BusinessPermission.ANALYTICS_VIEW);
  }
  return [...set];
}

export function membershipStatusLabelRu(status: string): string {
  return membershipStatusLabel('ru', status);
}

export function membershipRoleLabelRu(role: string): string {
  return membershipRoleLabel('ru', role);
}

export function membershipStatusLabelForLocale(locale: AppLocale, status: string): string {
  return membershipStatusLabel(locale, status);
}

export function membershipRoleLabelForLocale(locale: AppLocale, role: string): string {
  return membershipRoleLabel(locale, role);
}
