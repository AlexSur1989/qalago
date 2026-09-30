import type { QalaBackofficeIconName } from '@qalago/brand/icons';
import type { AdminTabId } from '@/lib/admin-utils';

/** Dashboard tab icons (order matches admin shell primary nav). */
export const ADMIN_TAB_ICONS: Record<AdminTabId, QalaBackofficeIconName> = {
  moderation: 'moderation',
  featured: 'star',
  reviews: 'review',
  monetization: 'wallet',
  categories: 'grid',
  content: 'sparkle',
  users: 'users',
  cities: 'city',
};

export type AdminShellRouteIconId =
  | 'catalog-businesses'
  | 'business-requests'
  | 'moderation-ugc'
  | 'legal'
  | 'reports'
  | 'staff'
  | 'audit'
  | 'settings';

export const ADMIN_SHELL_ROUTE_ICONS: Record<AdminShellRouteIconId, QalaBackofficeIconName> = {
  'catalog-businesses': 'business',
  'business-requests': 'file-request',
  'moderation-ugc': 'flag',
  legal: 'legal',
  reports: 'analytics',
  staff: 'staff',
  audit: 'audit',
  settings: 'settings',
};
