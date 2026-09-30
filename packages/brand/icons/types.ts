/** Canonical semantic backoffice icon names (Admin + Business shell/nav). */
export const QALA_BACKOFFICE_ICON_NAMES = [
  'dashboard',
  'moderation',
  'star',
  'review',
  'wallet',
  'grid',
  'sparkle',
  'users',
  'city',
  'business',
  'file-request',
  'flag',
  'legal',
  'analytics',
  'audit',
  'settings',
  'staff',
  'location',
  'image',
  'catalog',
  'promotion',
  'megaphone',
  'plan',
  'help',
  'notification',
  'menu',
  'close',
  'chevron-left',
  'chevron-right',
] as const;

export type QalaBackofficeIconName = (typeof QALA_BACKOFFICE_ICON_NAMES)[number];

export type QalaIconSize = 'sm' | 'md' | 'lg';

export function isQalaBackofficeIconName(value: string): value is QalaBackofficeIconName {
  return (QALA_BACKOFFICE_ICON_NAMES as readonly string[]).includes(value);
}
