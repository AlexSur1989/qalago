export {
  BusinessMembershipRole,
  BusinessMembershipStatus,
} from './business-membership';

export {
  BusinessPermission,
  ALL_BUSINESS_PERMISSIONS,
  BUSINESS_PERMISSION_LABELS_RU,
  normalizeBusinessPermissions,
} from './business-permission';

export enum UserRole {
  USER = 'USER',
  BUSINESS = 'BUSINESS',
  CITY_ADMIN = 'CITY_ADMIN',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  MODERATOR = 'MODERATOR',
  SALES_MANAGER = 'SALES_MANAGER',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  FINANCE = 'FINANCE',
  SUPPORT = 'SUPPORT',
  ANALYST = 'ANALYST',
  TECH_ADMIN = 'TECH_ADMIN',
}

export enum BusinessStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum PromotionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export enum AnalyticsEventType {
  VIEW_BUSINESS = 'VIEW_BUSINESS',
  CALL_CLICK = 'CALL_CLICK',
  WHATSAPP_CLICK = 'WHATSAPP_CLICK',
  ROUTE_CLICK = 'ROUTE_CLICK',
  FAVORITE_ADD = 'FAVORITE_ADD',
  FAVORITE_REMOVE = 'FAVORITE_REMOVE',
  PROMOTION_VIEW = 'PROMOTION_VIEW',
}

export interface CitySummary {
  id: string;
  slug: string;
  nameRu: string;
  nameKk?: string | null;
  countryCode: string;
  centerLat?: string | null;
  centerLng?: string | null;
  timezone: string;
  isActive: boolean;
  launchStatus?: 'COMING_SOON' | 'LIVE';
}

/** Safe public user identity for reviews and member lists. */
export interface PublicUserDto {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface UserSummary {
  id: string;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  preferredCityId?: string | null;
  managedCityId?: string | null;
  preferredCity?: Pick<CitySummary, 'id' | 'slug' | 'nameRu' | 'nameKk'> | null;
  managedCity?: Pick<CitySummary, 'id' | 'slug' | 'nameRu' | 'nameKk'> | null;
}

export interface AuthVerifyResponse {
  accessToken: string;
  user: UserSummary;
}

export interface CategorySummary {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface BusinessListItem {
  id: string;
  /** Present on forMap viewport rows (Stage 6.12A.7.1+). Omitted on ordinary business-grain lists. */
  locationId?: string;
  /**
   * Discovery navigation hint — BusinessLocation that gives this card physical context (A.7.9.1+).
   * Populated when a real branch context is known (e.g. map rows). Omitted on legacy business-grain lists until A.7.9.2+.
   */
  contextLocationId?: string;
  distanceMeters?: number;
  cityId: string;
  categoryId: string;
  title: string;
  slug: string;
  shortDesc?: string | null;
  address: string;
  latitude?: string | null;
  longitude?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  coverImageUrl?: string | null;
  status: BusinessStatus;
  isFeatured: boolean;
  category?: Pick<CategorySummary, 'id' | 'title' | 'slug' | 'icon'>;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PromotionListItem {
  id: string;
  businessId: string;
  /** A.7.9.4 — branch navigation hint for city feed (optional). */
  contextLocationId?: string | null;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  discountText?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: PromotionStatus;
  business?: Pick<
    BusinessListItem,
    'id' | 'title' | 'slug' | 'address' | 'coverImageUrl'
  >;
}

export interface AnalyticsEventRequest {
  businessId: string;
  type: AnalyticsEventType;
  /** Explicit navigation source for VIEW_BUSINESS (Stage 5H). */
  /** trafficSource + searchQuery only sent when source=SEARCH. */
  searchQuery?: string;
}

export interface AnalyticsSummary {
  businessId: string;
  days: number;
  total: number;
  byType: Record<AnalyticsEventType, number>;
}

export interface AnalyticsTrendItem {
  date: string;
  type: AnalyticsEventType;
  count: number;
}

export interface AnalyticsTrends {
  businessId: string;
  days: number;
  items: AnalyticsTrendItem[];
}

export {
  type AppLocaleCode,
  businessAuthoredText,
  cityDisplayName,
  normalizeOptionalLocaleText,
  resolveLocaleCode,
  taxonomyDisplayName,
} from './localized-content';

export const DEFAULT_CITY_SLUG = 'uralsk';

export const API_PREFIX = '/api/v1';

export {
  AppPlatform,
  UpdateMode,
  QalagoEnvironment,
  FEATURE_FLAG_KEYS,
  type FeatureFlagKey,
  type MobilePlatformConfigDto,
  type AppMaintenanceDto,
  type AppConfigResponseDto,
  type ServiceVersionDto,
} from './release-config';

export {
  PLATFORM_BUSINESS_FEATURE_FLAG_KEYS,
  type PlatformBusinessFeatureFlagKey,
  type PlatformFeatures,
  type PlatformFeaturesResponseDto,
  type PatchPlatformFeaturesDto,
  isPlatformBusinessFeatureFlagKey,
} from './platform-features';

export type { SubcategoryPublicDto, SubcategoryAdminDto } from './subcategory';

export {
  BusinessPlanTier,
  type BusinessPlanStatusDto,
  type MockPlanCheckoutResponse,
  type PlanCatalogItemDto,
  type PlanLimitsDto,
} from './plans';

export type {
  AnalyticsActionsDto,
  AnalyticsBenchmarkDto,
  AnalyticsCapabilitiesDto,
  AnalyticsComparisonDto,
  AnalyticsConversionDto,
  AnalyticsEffectiveRangeDto,
  AnalyticsLockedSectionDto,
  AnalyticsOverviewDto,
  AnalyticsPopularTimesDto,
  AnalyticsPromotionItemDto,
  AnalyticsRecommendationDto,
  AnalyticsSearchQueryItemDto,
  AnalyticsAudienceGeographyItemDto,
  AudienceDistanceBucket,
  AnalyticsSourceItemDto,
  AnalyticsTrendPointDto,
  AnalyticsTrendsDto,
  BusinessAnalyticsDashboardDto,
  BusinessTrafficSource,
} from './analytics';

export {
  ROLE_DEFINITIONS,
  getRoleDefinition,
  type RoleDefinition,
} from './rbac';

export {
  HomeSectionPlatform,
  HomeSectionType,
  HOME_SECTION_TYPES,
  HOME_SECTION_CANONICAL_FALLBACK,
  normalizePublicHomeSections,
  type AdminHomeSectionRowDto,
  type AdminHomeSectionsResponseDto,
  type PublicHomeSectionDto,
} from './home-sections';

export {
  MANDATORY_PLATFORM_LEGAL_DOCUMENT_TYPES,
  PUBLISHED_PLATFORM_LEGAL_VERSIONS,
  mandatoryLegalPublicPath,
  type MandatoryPlatformLegalDocumentType,
  type PublishedLegalVersionMeta,
} from './legal-published-manifest';

export {
  StaffPermission,
  STAFF_ROLES,
  STEP_UP_REQUIRED_PERMISSIONS,
  isStaffRole,
  staffRoleHasPermission,
  canAccessAdminWeb,
  canAccessBusinessWeb,
  canManageBusinessCabinet,
  canManageCities,
  canManageGlobalCategories,
  canManageUsers,
  canModerate,
  canViewUsers,
  isGlobalAdminRole,
  isSuperAdminRole,
  isPlatformGlobalAdminRole,
  canStaffMutateBusinessFeatured,
  canStaffOverrideBusinessPlan,
} from './staff-permissions';
