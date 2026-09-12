import { UserRole } from './index';

/** Canonical staff permission keys (Stage 6.9.1). */
export enum StaffPermission {
  STAFF_VIEW = 'STAFF_VIEW',
  STAFF_CREATE = 'STAFF_CREATE',
  STAFF_UPDATE = 'STAFF_UPDATE',
  STAFF_DISABLE = 'STAFF_DISABLE',
  STAFF_ROLE_ASSIGN = 'STAFF_ROLE_ASSIGN',
  STAFF_CITY_SCOPE_ASSIGN = 'STAFF_CITY_SCOPE_ASSIGN',
  STAFF_SESSION_REVOKE = 'STAFF_SESSION_REVOKE',

  USER_VIEW = 'USER_VIEW',
  USER_SUSPEND = 'USER_SUSPEND',

  BUSINESS_VIEW = 'BUSINESS_VIEW',
  BUSINESS_EDIT = 'BUSINESS_EDIT',
  BUSINESS_APPLICATION_REVIEW = 'BUSINESS_APPLICATION_REVIEW',
  BUSINESS_CLAIM_REVIEW = 'BUSINESS_CLAIM_REVIEW',
  BUSINESS_OWNERSHIP_CHANGE = 'BUSINESS_OWNERSHIP_CHANGE',

  MODERATION_VIEW = 'MODERATION_VIEW',
  MODERATION_ACT = 'MODERATION_ACT',
  MODERATION_APPEAL_REVIEW = 'MODERATION_APPEAL_REVIEW',

  CATEGORY_VIEW = 'CATEGORY_VIEW',
  CATEGORY_EDIT = 'CATEGORY_EDIT',
  CONTENT_EDIT = 'CONTENT_EDIT',

  ORDER_VIEW = 'ORDER_VIEW',
  ORDER_CREATE = 'ORDER_CREATE',
  PAYMENT_VIEW = 'PAYMENT_VIEW',
  PAYMENT_CONFIRM = 'PAYMENT_CONFIRM',
  REFUND_MANAGE = 'REFUND_MANAGE',

  AD_VIEW = 'AD_VIEW',
  AD_MANAGE = 'AD_MANAGE',
  AD_MODERATE = 'AD_MODERATE',

  ANALYTICS_VIEW = 'ANALYTICS_VIEW',

  REPORT_OVERVIEW_VIEW = 'REPORT_OVERVIEW_VIEW',
  REPORT_USERS_VIEW = 'REPORT_USERS_VIEW',
  REPORT_BUSINESSES_VIEW = 'REPORT_BUSINESSES_VIEW',
  REPORT_CITIES_VIEW = 'REPORT_CITIES_VIEW',
  REPORT_CATEGORIES_VIEW = 'REPORT_CATEGORIES_VIEW',
  REPORT_SEARCH_VIEW = 'REPORT_SEARCH_VIEW',
  REPORT_ACTIVITY_VIEW = 'REPORT_ACTIVITY_VIEW',
  REPORT_REVIEWS_VIEW = 'REPORT_REVIEWS_VIEW',
  REPORT_PROMOTIONS_VIEW = 'REPORT_PROMOTIONS_VIEW',
  REPORT_ADS_VIEW = 'REPORT_ADS_VIEW',
  REPORT_PLANS_VIEW = 'REPORT_PLANS_VIEW',
  REPORT_MODERATION_VIEW = 'REPORT_MODERATION_VIEW',
  REPORT_FINANCE_VIEW = 'REPORT_FINANCE_VIEW',
  REPORT_STAFF_VIEW = 'REPORT_STAFF_VIEW',
  REPORT_AUDIT_VIEW = 'REPORT_AUDIT_VIEW',
  REPORT_SECURITY_VIEW = 'REPORT_SECURITY_VIEW',
  REPORT_TECH_VIEW = 'REPORT_TECH_VIEW',
  REPORT_EXPORT = 'REPORT_EXPORT',

  LEGAL_VIEW = 'LEGAL_VIEW',
  LEGAL_PUBLISH = 'LEGAL_PUBLISH',
  DATA_RIGHTS_MANAGE = 'DATA_RIGHTS_MANAGE',
  GOVERNMENT_REQUEST_MANAGE = 'GOVERNMENT_REQUEST_MANAGE',
  SECURITY_INCIDENT_MANAGE = 'SECURITY_INCIDENT_MANAGE',

  FEATURE_FLAG_VIEW = 'FEATURE_FLAG_VIEW',
  FEATURE_FLAG_EDIT = 'FEATURE_FLAG_EDIT',
  RELEASE_CONFIG_VIEW = 'RELEASE_CONFIG_VIEW',
  RELEASE_CONFIG_EDIT = 'RELEASE_CONFIG_EDIT',
  MAINTENANCE_MODE_EDIT = 'MAINTENANCE_MODE_EDIT',

  AUDIT_VIEW = 'AUDIT_VIEW',
  AUDIT_SECURITY_VIEW = 'AUDIT_SECURITY_VIEW',
}

export const STAFF_ROLES: readonly UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.CITY_ADMIN,
  UserRole.MODERATOR,
  UserRole.SALES_MANAGER,
  UserRole.CONTENT_MANAGER,
  UserRole.FINANCE,
  UserRole.SUPPORT,
  UserRole.ANALYST,
  UserRole.TECH_ADMIN,
] as const;

export function isStaffRole(role: string): role is UserRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

const ALL = Object.values(StaffPermission);

const OPERATIONAL_REPORTS: readonly StaffPermission[] = [
  StaffPermission.REPORT_OVERVIEW_VIEW,
  StaffPermission.REPORT_USERS_VIEW,
  StaffPermission.REPORT_BUSINESSES_VIEW,
  StaffPermission.REPORT_CITIES_VIEW,
  StaffPermission.REPORT_CATEGORIES_VIEW,
  StaffPermission.REPORT_SEARCH_VIEW,
  StaffPermission.REPORT_ACTIVITY_VIEW,
  StaffPermission.REPORT_REVIEWS_VIEW,
  StaffPermission.REPORT_PROMOTIONS_VIEW,
  StaffPermission.REPORT_ADS_VIEW,
  StaffPermission.REPORT_PLANS_VIEW,
  StaffPermission.REPORT_MODERATION_VIEW,
];

const ANALYST_REPORTS: readonly StaffPermission[] = [
  ...OPERATIONAL_REPORTS,
  StaffPermission.REPORT_EXPORT,
];

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<StaffPermission>> = {
  [UserRole.USER]: new Set(),
  [UserRole.BUSINESS]: new Set(),
  [UserRole.SUPER_ADMIN]: new Set(ALL),
  [UserRole.ADMIN]: new Set([
    StaffPermission.USER_VIEW,
    StaffPermission.USER_SUSPEND,
    StaffPermission.BUSINESS_VIEW,
    StaffPermission.BUSINESS_EDIT,
    StaffPermission.BUSINESS_APPLICATION_REVIEW,
    StaffPermission.BUSINESS_CLAIM_REVIEW,
    StaffPermission.MODERATION_VIEW,
    StaffPermission.MODERATION_ACT,
    StaffPermission.MODERATION_APPEAL_REVIEW,
    StaffPermission.CATEGORY_VIEW,
    StaffPermission.CATEGORY_EDIT,
    StaffPermission.CONTENT_EDIT,
    StaffPermission.ORDER_VIEW,
    StaffPermission.PAYMENT_VIEW,
    StaffPermission.AD_VIEW,
    StaffPermission.AD_MANAGE,
    StaffPermission.AD_MODERATE,
    StaffPermission.ANALYTICS_VIEW,
    StaffPermission.REPORT_EXPORT,
    ...OPERATIONAL_REPORTS,
    StaffPermission.LEGAL_VIEW,
    StaffPermission.DATA_RIGHTS_MANAGE,
    StaffPermission.FEATURE_FLAG_VIEW,
    StaffPermission.RELEASE_CONFIG_VIEW,
    StaffPermission.AUDIT_VIEW,
  ]),
  [UserRole.CITY_ADMIN]: new Set([
    StaffPermission.BUSINESS_VIEW,
    StaffPermission.BUSINESS_EDIT,
    StaffPermission.BUSINESS_APPLICATION_REVIEW,
    StaffPermission.BUSINESS_CLAIM_REVIEW,
    StaffPermission.MODERATION_VIEW,
    StaffPermission.MODERATION_ACT,
    StaffPermission.ORDER_VIEW,
    StaffPermission.PAYMENT_VIEW,
    StaffPermission.AD_VIEW,
    StaffPermission.ANALYTICS_VIEW,
    StaffPermission.REPORT_OVERVIEW_VIEW,
    StaffPermission.REPORT_USERS_VIEW,
    StaffPermission.REPORT_BUSINESSES_VIEW,
    StaffPermission.REPORT_CITIES_VIEW,
    StaffPermission.REPORT_CATEGORIES_VIEW,
    StaffPermission.REPORT_SEARCH_VIEW,
    StaffPermission.REPORT_ACTIVITY_VIEW,
    StaffPermission.REPORT_REVIEWS_VIEW,
    StaffPermission.REPORT_PROMOTIONS_VIEW,
    StaffPermission.REPORT_ADS_VIEW,
    StaffPermission.REPORT_PLANS_VIEW,
    StaffPermission.REPORT_MODERATION_VIEW,
  ]),
  [UserRole.MODERATOR]: new Set([
    StaffPermission.MODERATION_VIEW,
    StaffPermission.MODERATION_ACT,
    StaffPermission.MODERATION_APPEAL_REVIEW,
    StaffPermission.BUSINESS_VIEW,
    StaffPermission.REPORT_MODERATION_VIEW,
  ]),
  [UserRole.SALES_MANAGER]: new Set([
    StaffPermission.BUSINESS_VIEW,
    StaffPermission.ORDER_VIEW,
    StaffPermission.ORDER_CREATE,
    StaffPermission.PAYMENT_VIEW,
    StaffPermission.AD_VIEW,
    StaffPermission.REPORT_BUSINESSES_VIEW,
    StaffPermission.REPORT_ADS_VIEW,
    StaffPermission.REPORT_PLANS_VIEW,
  ]),
  [UserRole.CONTENT_MANAGER]: new Set([
    StaffPermission.CATEGORY_VIEW,
    StaffPermission.CATEGORY_EDIT,
    StaffPermission.CONTENT_EDIT,
    StaffPermission.BUSINESS_VIEW,
    StaffPermission.BUSINESS_EDIT,
    StaffPermission.REPORT_CATEGORIES_VIEW,
    StaffPermission.REPORT_PROMOTIONS_VIEW,
  ]),
  [UserRole.FINANCE]: new Set([
    StaffPermission.ORDER_VIEW,
    StaffPermission.PAYMENT_VIEW,
    StaffPermission.PAYMENT_CONFIRM,
    StaffPermission.REFUND_MANAGE,
    StaffPermission.ANALYTICS_VIEW,
    StaffPermission.REPORT_FINANCE_VIEW,
    StaffPermission.REPORT_PLANS_VIEW,
    StaffPermission.REPORT_ADS_VIEW,
    StaffPermission.REPORT_EXPORT,
  ]),
  [UserRole.SUPPORT]: new Set([
    StaffPermission.USER_VIEW,
    StaffPermission.BUSINESS_VIEW,
    StaffPermission.ORDER_VIEW,
    StaffPermission.PAYMENT_VIEW,
    StaffPermission.MODERATION_VIEW,
    StaffPermission.REPORT_OVERVIEW_VIEW,
    StaffPermission.REPORT_USERS_VIEW,
    StaffPermission.REPORT_BUSINESSES_VIEW,
    StaffPermission.REPORT_MODERATION_VIEW,
  ]),
  [UserRole.ANALYST]: new Set([
    StaffPermission.ANALYTICS_VIEW,
    StaffPermission.REPORT_EXPORT,
    StaffPermission.ORDER_VIEW,
    StaffPermission.PAYMENT_VIEW,
    ...ANALYST_REPORTS,
  ]),
  [UserRole.TECH_ADMIN]: new Set([
    StaffPermission.FEATURE_FLAG_VIEW,
    StaffPermission.FEATURE_FLAG_EDIT,
    StaffPermission.RELEASE_CONFIG_VIEW,
    StaffPermission.MAINTENANCE_MODE_EDIT,
    StaffPermission.REPORT_TECH_VIEW,
    StaffPermission.REPORT_OVERVIEW_VIEW,
  ]),
};

export function staffRoleHasPermission(
  role: UserRole | string,
  permission: StaffPermission,
): boolean {
  const set = ROLE_PERMISSIONS[role as UserRole];
  if (!set) return false;
  return set.has(permission);
}

/** Roles that may sign in to admin-web (staff portal). */
export function canAccessAdminWeb(role: string): boolean {
  return isStaffRole(role);
}

export function canModerate(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.MODERATION_ACT);
}

export function canViewUsers(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.USER_VIEW);
}

export function canManageUsers(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.STAFF_ROLE_ASSIGN);
}

export function isGlobalAdminRole(role: string): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

export function isSuperAdminRole(role: string): boolean {
  return role === UserRole.SUPER_ADMIN;
}

export function canManageCities(role: string): boolean {
  return role === UserRole.SUPER_ADMIN;
}

export function canManageGlobalCategories(role: string): boolean {
  return (
    role === UserRole.SUPER_ADMIN ||
    staffRoleHasPermission(role as UserRole, StaffPermission.CATEGORY_EDIT)
  );
}

export function canManageBusinessCabinet(role: string): boolean {
  return (
    role === UserRole.BUSINESS ||
    isGlobalAdminRole(role) ||
    role === UserRole.CITY_ADMIN
  );
}

export function canAccessBusinessWeb(role: string): boolean {
  return canManageBusinessCabinet(role);
}

/** Step-up candidates (MFA-ready seam; enforcement is future stage). */
export const STEP_UP_REQUIRED_PERMISSIONS: ReadonlySet<StaffPermission> = new Set([
  StaffPermission.STAFF_ROLE_ASSIGN,
  StaffPermission.STAFF_DISABLE,
  StaffPermission.RELEASE_CONFIG_EDIT,
  StaffPermission.LEGAL_PUBLISH,
  StaffPermission.GOVERNMENT_REQUEST_MANAGE,
  StaffPermission.SECURITY_INCIDENT_MANAGE,
]);
