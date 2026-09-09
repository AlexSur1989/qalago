import { api } from './api-core';

export type AuthUser = {
  id: string;
  phone?: string | null;
  email?: string | null;
  name: string | null;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  managedCityId?: string | null;
  managedCity?: { slug: string; nameRu: string } | null;
};

export const adminApi = {  sendCode: (phone: string) =>
    api<{ success: boolean; debugCode?: string }>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyCode: (phone: string, code: string) =>
    api<{ accessToken: string; user: AuthUser }>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  devLogin: (phone: string) =>
    api<{ accessToken: string; user: AuthUser }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  getMe: (token: string) => api<AuthUser>('/users/me', { token }),

  listBusinesses: (
    token: string,
    citySlug = 'uralsk',
    status?: string,
    page = 1,
    limit = 20,
  ) => {
    const params = new URLSearchParams({
      citySlug,
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set('status', status);
    return api<{ items: BusinessRow[]; meta: ListMeta }>(
      `/admin/businesses?${params}`,
      { token },
    );
  },

  updateStatus: (token: string, id: string, status: string) =>
    api(`/admin/businesses/${id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    }),

  updateFeatured: (
    token: string,
    id: string,
    data: { isFeatured: boolean; featuredSlot?: number | null },
  ) =>
    api(`/admin/businesses/${id}/featured`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  updateBusinessPlan: (token: string, id: string, tier: string) =>
    api(`/admin/businesses/${id}/plan`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ tier }),
    }),

  listPlans: () => api<PlanCatalogRow[]>('/plans'),

  listCities: () =>
    api<CityRow[]>('/cities'),

  listCitiesAdmin: (token: string) =>
    api<CityRow[]>('/admin/cities', { token }),

  createCity: (
    token: string,
    data: {
      slug: string;
      nameRu: string;
      nameKk?: string;
      centerLat?: number;
      centerLng?: number;
      timezone?: string;
      isActive?: boolean;
      launchStatus?: 'COMING_SOON' | 'LIVE';
    },
  ) =>
    api<CityRow>('/admin/cities', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  updateCity: (
    token: string,
    id: string,
    data: {
      nameRu?: string;
      nameKk?: string;
      centerLat?: number;
      centerLng?: number;
      timezone?: string;
      isActive?: boolean;
      launchStatus?: 'COMING_SOON' | 'LIVE';
    },
  ) =>
    api<CityRow>(`/admin/cities/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  searchGeoPlaces: (token: string, q: string, country = 'kz') => {
    const params = new URLSearchParams({ q, country });
    return api<GeoPlaceSuggestion[]>(`/admin/geo/search?${params}`, { token });
  },

  listCategoriesAdmin: (token: string, citySlug = 'uralsk') => {
    const params = new URLSearchParams({ citySlug });
    return api<CategoryRow[]>(`/admin/categories?${params}`, { token });
  },

  listUsers: (token: string) =>
    api<AuthUser[]>('/admin/users', { token }),

  listAuditLogs: (
    token: string,
    params: {
      page?: number;
      limit?: number;
      action?: string;
      resourceType?: string;
      businessId?: string;
      cityId?: string;
      actorUserId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.action) qs.set('action', params.action);
    if (params.resourceType) qs.set('resourceType', params.resourceType);
    if (params.businessId) qs.set('businessId', params.businessId);
    if (params.cityId) qs.set('cityId', params.cityId);
    if (params.actorUserId) qs.set('actorUserId', params.actorUserId);
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params.dateTo) qs.set('dateTo', params.dateTo);
    const query = qs.toString();
    return api<{ items: AuditLogRow[]; meta: ListMeta }>(
      `/admin/audit-logs${query ? `?${query}` : ''}`,
      { token },
    );
  },

  updateUserRole: (token: string, id: string, role: string, managedCityId?: string | null) =>
    api<AuthUser>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ role, managedCityId }),
    }),

  listCategories: () => api<CategoryRow[]>('/categories'),

  createCategory: (
    token: string,
    data: { title: string; slug: string; icon?: string; sortOrder?: number; isActive?: boolean },
  ) =>
    api<CategoryRow>('/categories', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  updateCategory: (token: string, id: string, data: Record<string, unknown>) =>
    api<CategoryRow>(`/categories/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  deleteCategory: (token: string, id: string) =>
    api<void>(`/categories/${id}`, { method: 'DELETE', token }),

  updateCategoryCityOrder: (
    token: string,
    id: string,
    data: { citySlug: string; sortOrder: number },
  ) =>
    api<{ success: boolean }>(`/admin/categories/${id}/city-order`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  updateCategoryCityVisibility: (
    token: string,
    id: string,
    data: { citySlug: string; isHidden: boolean },
  ) =>
    api<{ success: boolean; isHidden: boolean }>(`/admin/categories/${id}/city-visibility`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  listReviews: (token: string, citySlug?: string, limit = 50) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (citySlug) params.set('citySlug', citySlug);
    return api<AdminReviewRow[]>(`/admin/reviews?${params}`, { token });
  },

  deleteReview: (token: string, id: string) =>
    api<{ success: boolean }>(`/admin/reviews/${id}`, { method: 'DELETE', token }),
};

export type EditorialDraft = {
  agent: string;
  citySlug: string;
  title: string;
  bodyMarkdown: string;
  businessIds: string[];
  source: string;
};

export type ModerationAnalysis = {
  score: number;
  suggestedAction: 'approve' | 'review' | 'reject' | string;
  flags: { code: string; message: string; severity: string }[];
};

export const aiApi = {
  createContentDraft: (
    token: string,
    params: {
      citySlug: string;
      topic?: string;
      limit?: number;
    },
  ) =>
    api<EditorialDraft>('/admin/ai/content/draft', {
      method: 'POST',
      token,
      body: JSON.stringify(params),
    }),

  analyzeModeration: (token: string, params: { text: string; rating: number }) =>
    api<ModerationAnalysis>('/admin/ai/moderation/analyze', {
      method: 'POST',
      token,
      body: JSON.stringify(params),
    }),
};

export type ListMeta = {
  page: number;
  limit: number;
  total: number;
};

export type GeoPlaceSuggestion = {
  nameRu: string;
  nameKk?: string;
  lat: number;
  lng: number;
  displayName: string;
  slugSuggestion: string;
  timezone: string;
};

export type CityRow = {
  id: string;
  slug: string;
  nameRu: string;
  nameKk?: string | null;
  countryCode?: string;
  centerLat?: string | number | null;
  centerLng?: string | number | null;
  timezone?: string;
  isActive?: boolean;
  launchStatus?: 'COMING_SOON' | 'LIVE';
  launchDate?: string | null;
  createdAt?: string;
};

export type BusinessRow = {
  id: string;
  title: string;
  status: string;
  address: string;
  shortDesc?: string | null;
  phone?: string | null;
  coverImageUrl?: string | null;
  isFeatured: boolean;
  featuredSlot?: number | null;
  planTier?: string;
  planExpiresAt?: string | null;
  category?: { id: string; title: string; slug: string } | null;
  owner?: { phone: string; name: string | null };
  city?: { slug: string; nameRu: string };
  createdAt?: string;
};

export type PlanCatalogRow = {
  tier: string;
  slug: string;
  nameRu: string;
  priceKzt: number;
  periodDays: number | null;
  features: string[];
};

export type CategoryRow = {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  citySortOrder?: number | null;
  cityIsHidden?: boolean;
  effectiveSortOrder?: number;
};

export type AdminReviewRow = {
  id: string;
  businessId: string;
  rating: number;
  text?: string | null;
  ownerReply?: string | null;
  createdAt: string;
  user?: { id: string; phone: string; name?: string | null };
  business?: { id: string; title: string; city?: { slug: string; nameRu: string } };
};

export type AuditLogRow = {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  businessId?: string | null;
  cityId?: string | null;
  targetUserId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor?: { id: string; name?: string | null; phone: string; role: string } | null;
  business?: { id: string; title: string } | null;
  city?: { id: string; slug: string; nameRu: string } | null;
};

export const TOKEN_KEY = 'qalago_admin_token';

export { monetizationApi } from './monetization-api';
export type {
  MonetizationOrderRow,
  MonetizationOrderDetail,
  MonetizationPaymentRow,
  MonetizationCampaignRow,
  CampaignAnalytics,
  MonetizationCreativeRow,
  AdPlacementRow,
} from './monetization-api';
