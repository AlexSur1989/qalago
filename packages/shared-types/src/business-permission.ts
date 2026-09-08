/** Business-scoped capability — distinct from system UserRole. */
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

/** ANALYTICS_EXPORT requires ANALYTICS_VIEW */
export function normalizeBusinessPermissions(
  permissions: BusinessPermission[],
): BusinessPermission[] {
  const set = new Set(permissions);
  if (set.has(BusinessPermission.ANALYTICS_EXPORT)) {
    set.add(BusinessPermission.ANALYTICS_VIEW);
  }
  return [...set];
}
