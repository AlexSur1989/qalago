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

export const BUSINESS_PERMISSION_LABELS_RU: Record<BusinessPermission, string> = {
  [BusinessPermission.BUSINESS_PROFILE_EDIT]: 'Редактирование профиля',
  [BusinessPermission.BUSINESS_HOURS_EDIT]: 'График работы',
  [BusinessPermission.CATALOG_EDIT]: 'Каталог / услуги',
  [BusinessPermission.PHOTOS_EDIT]: 'Фотографии',
  [BusinessPermission.PROMOTIONS_EDIT]: 'Акции',
  [BusinessPermission.REVIEWS_REPLY]: 'Ответы на отзывы',
  [BusinessPermission.ANALYTICS_VIEW]: 'Просмотр аналитики',
  [BusinessPermission.ANALYTICS_EXPORT]: 'Экспорт аналитики',
  [BusinessPermission.ADS_MANAGE]: 'Реклама и продвижение',
  [BusinessPermission.PAYMENTS_VIEW]: 'Платежи',
};

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

const MAIN_NAV: BusinessNavItem[] = [
  { id: 'home', label: 'Обзор', icon: '🏠', href: () => '/dashboard' },
  {
    id: 'profile',
    label: 'Мой бизнес',
    icon: '🏪',
    href: (id) => `/business/${id}`,
    anyOf: [BusinessPermission.BUSINESS_PROFILE_EDIT, BusinessPermission.BUSINESS_HOURS_EDIT],
  },
  {
    id: 'menu',
    label: 'Товары и услуги',
    icon: '📋',
    href: (id) => `/business/${id}/menu`,
    anyOf: [BusinessPermission.CATALOG_EDIT],
  },
  {
    id: 'promotions',
    label: 'Акции',
    icon: '🏷️',
    href: (id) => `/business/${id}/promotions`,
    anyOf: [BusinessPermission.PROMOTIONS_EDIT],
  },
  {
    id: 'monetization',
    label: 'Реклама и продвижение',
    icon: '📣',
    href: () => '/monetization',
    anyOf: [BusinessPermission.ADS_MANAGE],
  },
  {
    id: 'stats',
    label: 'Статистика',
    icon: '📊',
    href: () => '/statistics',
    anyOf: [BusinessPermission.ANALYTICS_VIEW],
  },
  {
    id: 'settings',
    label: 'Настройки',
    icon: '⚙️',
    href: () => '/settings',
    anyOf: [BusinessPermission.BUSINESS_PROFILE_EDIT],
  },
  {
    id: 'team',
    label: 'Команда',
    icon: '👥',
    href: (id) => `/business/${id}/team`,
    ownerOnly: true,
  },
];

const FOOTER_NAV: BusinessNavItem[] = [
  {
    id: 'plan',
    label: 'Тариф',
    icon: '💎',
    href: () => '/plan',
    anyOf: [BusinessPermission.PAYMENTS_VIEW],
  },
  { id: 'help', label: 'Помощь', icon: '❓', href: () => '/help' },
];

export type PermissionPreset = {
  id: string;
  labelRu: string;
  descriptionRu?: string;
  permissions: BusinessPermission[];
};

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: 'manager',
    labelRu: 'Управляющий',
    descriptionRu: 'Операционный доступ без управления командой',
    permissions: [
      BusinessPermission.BUSINESS_PROFILE_EDIT,
      BusinessPermission.BUSINESS_HOURS_EDIT,
      BusinessPermission.CATALOG_EDIT,
      BusinessPermission.PHOTOS_EDIT,
      BusinessPermission.PROMOTIONS_EDIT,
      BusinessPermission.REVIEWS_REPLY,
      BusinessPermission.ANALYTICS_VIEW,
      BusinessPermission.ANALYTICS_EXPORT,
      BusinessPermission.ADS_MANAGE,
      BusinessPermission.PAYMENTS_VIEW,
    ],
  },
  {
    id: 'content',
    labelRu: 'Контент-менеджер',
    descriptionRu: 'Профиль, каталог, фото и акции',
    permissions: [
      BusinessPermission.BUSINESS_PROFILE_EDIT,
      BusinessPermission.BUSINESS_HOURS_EDIT,
      BusinessPermission.CATALOG_EDIT,
      BusinessPermission.PHOTOS_EDIT,
      BusinessPermission.PROMOTIONS_EDIT,
    ],
  },
  {
    id: 'marketing',
    labelRu: 'Маркетолог',
    descriptionRu: 'Акции, реклама и базовая аналитика',
    permissions: [
      BusinessPermission.PROMOTIONS_EDIT,
      BusinessPermission.ADS_MANAGE,
      BusinessPermission.ANALYTICS_VIEW,
    ],
  },
  {
    id: 'analytics',
    labelRu: 'Аналитик',
    descriptionRu: 'Просмотр и экспорт статистики',
    permissions: [BusinessPermission.ANALYTICS_VIEW, BusinessPermission.ANALYTICS_EXPORT],
  },
];

export const PAYMENTS_ACCESS_DENIED_RU =
  'Нет доступа к подписке и платежам. Обратитесь к владельцу бизнеса.';

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

export function buildMainNavItems(): BusinessNavItem[] {
  return MAIN_NAV.map((item) => ({ ...item }));
}

export function buildFooterNavItems(): BusinessNavItem[] {
  return FOOTER_NAV.map((item) => ({ ...item }));
}

/** ANALYTICS_EXPORT implies ANALYTICS_VIEW in UI selections. */
export function normalizeSelectedPermissions(permissions: BusinessPermission[]): BusinessPermission[] {
  const set = new Set(permissions);
  if (set.has(BusinessPermission.ANALYTICS_EXPORT)) {
    set.add(BusinessPermission.ANALYTICS_VIEW);
  }
  return [...set];
}

export function membershipStatusLabelRu(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Активен';
    case 'SUSPENDED':
      return 'Приостановлен';
    case 'REVOKED':
      return 'Отозван';
    case 'INVITED':
      return 'Приглашён';
    default:
      return status;
  }
}

export function membershipRoleLabelRu(role: string): string {
  switch (role) {
    case 'OWNER':
      return 'Владелец';
    case 'MANAGER':
      return 'Менеджер';
    default:
      return role;
  }
}
