import { StaffPermission, staffRoleHasPermission, UserRole } from '@qalago/shared-types';

export type ReportNavId =
  | 'overview'
  | 'users'
  | 'businesses'
  | 'cities'
  | 'categories'
  | 'search'
  | 'activity'
  | 'reviews'
  | 'promotions'
  | 'ads'
  | 'plans'
  | 'moderation'
  | 'finance'
  | 'staff'
  | 'audit'
  | 'security'
  | 'system';

const REPORT_PERMISSION: Record<ReportNavId, StaffPermission> = {
  overview: StaffPermission.REPORT_OVERVIEW_VIEW,
  users: StaffPermission.REPORT_USERS_VIEW,
  businesses: StaffPermission.REPORT_BUSINESSES_VIEW,
  cities: StaffPermission.REPORT_CITIES_VIEW,
  categories: StaffPermission.REPORT_CATEGORIES_VIEW,
  search: StaffPermission.REPORT_SEARCH_VIEW,
  activity: StaffPermission.REPORT_ACTIVITY_VIEW,
  reviews: StaffPermission.REPORT_REVIEWS_VIEW,
  promotions: StaffPermission.REPORT_PROMOTIONS_VIEW,
  ads: StaffPermission.REPORT_ADS_VIEW,
  plans: StaffPermission.REPORT_PLANS_VIEW,
  moderation: StaffPermission.REPORT_MODERATION_VIEW,
  finance: StaffPermission.REPORT_FINANCE_VIEW,
  staff: StaffPermission.REPORT_STAFF_VIEW,
  audit: StaffPermission.REPORT_AUDIT_VIEW,
  security: StaffPermission.REPORT_SECURITY_VIEW,
  system: StaffPermission.REPORT_TECH_VIEW,
};

export const REPORT_NAV: { id: ReportNavId; label: string }[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'users', label: 'Пользователи' },
  { id: 'businesses', label: 'Бизнесы' },
  { id: 'cities', label: 'Города' },
  { id: 'categories', label: 'Категории' },
  { id: 'search', label: 'Поиск' },
  { id: 'activity', label: 'Активность' },
  { id: 'reviews', label: 'Отзывы' },
  { id: 'promotions', label: 'Акции' },
  { id: 'ads', label: 'Реклама' },
  { id: 'plans', label: 'Тарифы' },
  { id: 'moderation', label: 'Модерация' },
  { id: 'finance', label: 'Финансы' },
  { id: 'staff', label: 'Сотрудники' },
  { id: 'audit', label: 'Audit' },
  { id: 'security', label: 'Безопасность' },
  { id: 'system', label: 'Система' },
];

export function canViewReport(role: string, reportId: ReportNavId): boolean {
  const perm = REPORT_PERMISSION[reportId];
  return staffRoleHasPermission(role as UserRole, perm);
}

export function visibleReportNav(role: string) {
  return REPORT_NAV.filter((item) => canViewReport(role, item.id));
}
