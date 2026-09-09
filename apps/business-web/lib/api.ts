const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export type CategoryRow = {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
};

export type CityRow = {
  id: string;
  slug: string;
  nameRu: string;
};

export type AuthUser = {
  id: string;
  phone?: string | null;
  email?: string | null;
  name: string | null;
  role: string;
};

export type BusinessAccessRole = 'OWNER' | 'MANAGER';

export type BusinessAccessInfo = {
  role: BusinessAccessRole;
  permissions: string[];
};

export type MyBusinessItem = {
  business: BusinessRow;
  access: BusinessAccessInfo;
};

export type TeamMemberRow = {
  membershipId: string;
  userId: string;
  name: string | null;
  phone: string | null;
  role: BusinessAccessRole;
  status: string;
  permissions: string[];
  createdAt: string;
};

export type TeamInvitationRow = {
  invitationId: string;
  phone: string | null;
  email: string | null;
  inviteType: 'email' | 'phone';
  permissions: string[];
  status: string;
  expiresAt: string;
  createdAt: string;
};

export type ResolvedInvitation = {
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  businessName: string;
  recipientEmailMasked: string | null;
  expiresAt: string;
};

export type TeamListResponse = {
  members: TeamMemberRow[];
  pendingInvitations: TeamInvitationRow[];
};

export type TeamAuditRow = {
  id: string;
  action: string;
  createdAt: string;
  actor?: { id: string; name?: string | null; phone: string } | null;
  metadata?: Record<string, unknown> | null;
};

export type BusinessRow = {
  id: string;
  title: string;
  status: string;
  address: string;
  shortDesc?: string | null;
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  website?: string | null;
  coverImageUrl?: string | null;
  workHours?: Record<string, string> | null;
  planTier?: string;
  planExpiresAt?: string | null;
  isFeatured?: boolean;
  featuredSlot?: number | null;
  createdAt?: string;
  updatedAt?: string;
  city?: { slug: string; nameRu: string } | null;
  categoryId?: string;
  category?: { id: string; slug: string; title: string } | null;
};

export type PlanLimitsRow = {
  maxPhotos: number;
  maxServiceItems: number;
  maxActivePromotions: number;
  maxPromotionDurationDays: number;
  maxPromotionsCreatedPerDay: number;
  maxAnalyticsDays: number;
  advertisingDiscountPercent: number;
  analyticsTier: 'BASIC' | 'EXTENDED' | 'FULL';
  supportPriority: 'STANDARD' | 'PRIORITY' | 'HIGHEST';
  moderationPriority: 'STANDARD' | 'PRIORITY' | 'HIGHEST';
  showPlanBadge: boolean;
};

export type PlanCatalogRow = {
  tier: string;
  slug: string;
  nameRu: string;
  priceKzt: number;
  periodDays: number | null;
  features: string[];
  limits: PlanLimitsRow;
};

export type PlanEntitlements = {
  photos: { total: number; published: number; limit: number; overLimit: boolean };
  serviceItems: { total: number; published: number; limit: number; overLimit: boolean };
  activePromotions: { total: number; published: number; limit: number; overLimit: boolean };
  overLimitNotice: string | null;
};

export type BusinessPlanStatus = {
  businessId: string;
  tier: string;
  effectiveTier: string;
  expiresAt: string | null;
  isFeatured: boolean;
  featuredSlot: number | null;
  catalog: PlanCatalogRow;
  limits: PlanLimitsRow;
  usage: {
    photos: number;
    serviceItems: number;
    activePromotions: number;
  };
  entitlements?: PlanEntitlements;
};

export type PromotionRow = {
  id: string;
  title: string;
  description?: string | null;
  discountText?: string | null;
  imageUrl?: string | null;
  status: string;
  businessId: string;
  createdAt?: string;
};

export type AnalyticsDashboard = {
  businessId: string;
  plan: string;
  effectivePlan: string;
  headline: string;
  capabilities: {
    maxDays: number;
    views: boolean;
    viewTrend: boolean;
    actions: boolean;
    actionTrend: boolean;
    trafficSources: boolean;
    conversion: boolean;
    periodComparison: boolean;
    promotionAnalytics: boolean;
    popularTimes: boolean;
    benchmark: boolean;
    recommendations: boolean;
    searchQueries: boolean;
    audienceGeography: boolean;
    reportExport: boolean;
  };
  lockedSections: Array<{
    id: string;
    label: string;
    requiredPlan: string;
    message: string;
  }>;
  effectiveRange: { days: number; from: string; to: string };
  overview: { views: number; totalCustomerActions?: number };
  actions: {
    total: number;
    calls: number;
    whatsapp: number;
    routes: number;
    website: number;
    instagram: number;
    favorites: number;
    promotionViews: number;
  } | null;
  trends: {
    views: Array<{ date: string; count: number }>;
    actions?: Array<{ date: string; count: number }>;
  };
  sources: Array<{ source: string; label: string; views: number; share: number }> | null;
  sourcesStatus?: 'DEFERRED' | null;
  searchQueries: Array<{ query: string; count: number; percentage: number }> | null;
  searchQueriesStatus?: 'AVAILABLE' | 'INSUFFICIENT_DATA' | null;
  searchQueriesOtherCount?: number | null;
  conversion: { views: number; actions: number; rate: number } | null;
  comparison: {
    currentDays: number;
    previousDays: number;
    metrics: Array<{
      key: string;
      label: string;
      current: number;
      previous: number;
      deltaPercent: number | null;
    }>;
  } | null;
  promotions: { promotionViews: number } | null;
  popularTimes: {
    byHour: Array<{ hour: number; count: number }>;
    byWeekday: Array<{ weekday: number; label: string; count: number }>;
  } | null;
  benchmark: {
    status?: 'AVAILABLE' | 'INSUFFICIENT_DATA';
    categoryTitle: string;
    businessViews?: number;
    categoryAvgViews?: number;
    businessActions?: number;
    categoryAvgActions?: number;
    cohortSize?: number;
    message?: string;
  } | null;
  recommendations: Array<{ id: string; title: string; body: string }> | null;
  audienceGeography: Array<{
    bucket: string;
    label: string;
    count: number;
    percentage: number;
  }> | null;
  audienceGeographyStatus?: 'AVAILABLE' | 'INSUFFICIENT_DATA' | null;
};

export type AnalyticsSummary = {
  businessId: string;
  days: number;
  total: number;
  byType: Record<string, number>;
};

export type AnalyticsTrendItem = {
  date: string;
  type: string;
  count: number;
};

export type AnalyticsTrends = {
  businessId: string;
  days: number;
  items: AnalyticsTrendItem[];
};

export type ReviewRow = {
  id: string;
  businessId: string;
  rating: number;
  text?: string | null;
  ownerReply?: string | null;
  createdAt: string;
  user?: { id: string; name?: string | null };
};

export type ServiceMenuItem = {
  id: string;
  businessId: string;
  groupId?: string | null;
  title: string;
  description?: string | null;
  price?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type ServiceMenuGroup = {
  id: string;
  businessId: string;
  title: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  items: ServiceMenuItem[];
};

export type ServiceMenuManage = {
  groups: ServiceMenuGroup[];
  ungrouped: ServiceMenuItem[];
};

export type ManageMenuSection = {
  id: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
};

export type ManageMenuItemRow = {
  id: string;
  title: string;
  description?: string | null;
  price?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  sectionId?: string | null;
  section?: {
    id: string;
    title: string;
    sortOrder: number;
    isActive: boolean;
  } | null;
};

export type ManageMenuItemsPage = {
  items: ManageMenuItemRow[];
  sections: ManageMenuSection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type BusinessImageRow = {
  id: string;
  businessId: string;
  imageUrl: string;
  sortOrder: number;
};

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type MonetizationDurationOption = {
  durationHours?: number | null;
  durationDays?: number | null;
  basePrice: number;
  discountPercent?: number | null;
  finalPrice: number;
  currency: string;
};

export type MonetizationProduct = {
  code: string;
  name: string;
  description?: string | null;
  type: string;
  durations: MonetizationDurationOption[];
};

export type MonetizationPackage = {
  code: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  durationDays: number;
  discountPercent?: number | null;
  items: Array<{
    productCode: string;
    productName: string;
    productType: string;
    durationDays?: number | null;
    durationHours?: number | null;
    quantity: number;
  }>;
};

export type MonetizationQuote = {
  product?: { code: string; name: string; type: string } | null;
  package?: { code: string; name: string } | null;
  duration?: { durationDays?: number; durationHours?: number } | null;
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  currency: string;
  requestedStartAt?: string | null;
  calculatedEndAt?: string | null;
  availability: { available: boolean; reason?: string | null; nextAvailableAt?: string | null };
};

export type MonetizationOrderCampaign = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  requestedStartAt?: string | null;
  product: { code: string; name: string };
  creative?: { id: string; title: string; moderationStatus: string } | null;
  placements: Array<{ code: string; name: string; nameRu?: string }>;
};

export type MonetizationOrder = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  paidAt?: string | null;
  items: Array<{
    id: string;
    productCode: string;
    productName: string;
    productType: string;
    finalPrice: number;
    durationDays?: number | null;
    durationHours?: number | null;
  }>;
  payments: Array<{ id: string; status: string; provider: string; amount: number }>;
  campaigns?: MonetizationOrderCampaign[];
};

export type MonetizationCampaign = {
  id: string;
  businessId: string;
  businessTitle?: string | null;
  status: string;
  effectiveStatus?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  requestedStartAt?: string | null;
  effectivePeriodStarted?: boolean;
  product?: { code: string; name: string; type: string } | null;
  creative?: { id: string; title?: string; moderationStatus: string } | null;
  placements?: Array<{ code: string; name: string; nameRu?: string }>;
  metrics?: { servedCount: number; qualifiedImpressions: number; clickCount: number };
};

export type MonetizationCreative = {
  id: string;
  businessId: string;
  type: string;
  imageUrl: string | null;
  title: string;
  description: string | null;
  buttonText: string | null;
  targetType: string;
  targetId: string | null;
  targetUrl: string | null;
  moderationStatus: string;
  moderationComment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MonetizationCampaignAnalytics = {
  campaignId: string;
  period: { from: string | null; to: string | null };
  served: number;
  qualifiedImpressions: number;
  clicks: number;
  ctr: number;
  actions: Record<string, number>;
};

export type CreateMonetizationCreativePayload = {
  businessId: string;
  type?: string;
  imageUrl?: string;
  title: string;
  description?: string;
  buttonText?: string;
  targetType?: string;
  targetId?: string;
  targetUrl?: string;
};

export const SELECTED_BUSINESS_KEY = 'qalago_business_id';

export function myBusinessRows(items: MyBusinessItem[]): BusinessRow[] {
  return items.map((item) => item.business);
}

export function findMyBusinessItem(
  items: MyBusinessItem[],
  businessId: string,
): MyBusinessItem | undefined {
  return items.find((item) => item.business.id === businessId);
}

async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function uploadApi<T>(
  path: string,
  token: string,
  file: File,
): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const ownerApi = {
  sendCode: (phone: string) =>
    api<{ success: boolean; debugCode?: string }>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyCode: (phone: string, code: string, accountType?: 'user' | 'business') =>
    api<{ accessToken: string; user: AuthUser }>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code, ...(accountType ? { accountType } : {}) }),
    }),

  devLogin: (phone: string) =>
    api<{ accessToken: string; user: AuthUser }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  signInWithGoogle: (idToken: string) =>
    api<{ accessToken: string; user: AuthUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  signInWithApple: (identityToken: string) =>
    api<{ accessToken: string; user: AuthUser }>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ identityToken }),
    }),

  getMe: (token: string) => api<AuthUser>('/users/me', { token }),

  updateMe: (token: string, data: { name?: string; preferredCityId?: string }) =>
    api<AuthUser>('/users/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  listCategories: () => api<CategoryRow[]>('/categories'),

  listCities: () => api<CityRow[]>('/cities'),

  listMyBusinesses: (token: string) =>
    api<{ items: MyBusinessItem[] }>('/businesses/my', { token }),

  listTeam: (token: string, businessId: string) =>
    api<TeamListResponse>(`/businesses/${encodeURIComponent(businessId)}/team`, { token }),

  inviteTeamMember: (
    token: string,
    businessId: string,
    data: { email?: string; phone?: string; permissions: string[] },
  ) =>
    api<{
      type: 'membership' | 'invitation';
      membershipId?: string;
      invitationId?: string;
      expiresAt?: string;
      inviteUrl?: string;
      rawToken?: string;
    }>(`/businesses/${encodeURIComponent(businessId)}/team/invite`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  resolveInvitation: (inviteToken: string) =>
    api<ResolvedInvitation>('/invitations/resolve', {
      method: 'POST',
      body: JSON.stringify({ token: inviteToken }),
    }),

  acceptInvitation: (token: string, inviteToken: string) =>
    api<{ businessId: string; membershipId: string; alreadyMember?: boolean; alreadyAccepted?: boolean }>(
      '/invitations/accept',
      {
        method: 'POST',
        token,
        body: JSON.stringify({ token: inviteToken }),
      },
    ),

  updateTeamMember: (
    token: string,
    businessId: string,
    membershipId: string,
    data: { permissions?: string[]; status?: string },
  ) =>
    api<TeamMemberRow>(`/businesses/${encodeURIComponent(businessId)}/team/${membershipId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  revokeInvitation: (token: string, businessId: string, invitationId: string) =>
    api<void>(
      `/businesses/${encodeURIComponent(businessId)}/team/invitations/${invitationId}`,
      { method: 'DELETE', token },
    ),

  listTeamAudit: (token: string, businessId: string, page = 1) =>
    api<{ items: TeamAuditRow[]; meta: { page: number; limit: number; total: number } }>(
      `/businesses/${encodeURIComponent(businessId)}/team/audit?page=${page}&limit=20`,
      { token },
    ),

  getBusiness: (token: string, id: string) =>
    api<BusinessRow>(`/businesses/${id}`, { token }),

  updateBusiness: (token: string, id: string, data: Record<string, unknown>) =>
    api<BusinessRow>(`/businesses/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  listPromotions: (token: string, businessId: string) =>
    api<{ items: PromotionRow[] }>(
      `/promotions?businessId=${encodeURIComponent(businessId)}&limit=50`,
      { token },
    ),

  createPromotion: (
    token: string,
    data: {
      businessId: string;
      title: string;
      description?: string;
      discountText?: string;
      status?: string;
    },
  ) =>
    api<PromotionRow>('/promotions', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  updatePromotion: (
    token: string,
    id: string,
    data: Record<string, unknown>,
  ) =>
    api<PromotionRow>(`/promotions/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  deletePromotion: (token: string, id: string) =>
    api<void>(`/promotions/${id}`, { method: 'DELETE', token }),

  analyticsDashboard: (token: string, businessId: string, days = 30) =>
    api<AnalyticsDashboard>(
      `/analytics/business/${businessId}/dashboard?days=${days}`,
      { token },
    ),

  downloadAnalyticsExport: async (token: string, businessId: string, days = 30) => {
    const res = await fetch(
      `${API_BASE}/analytics/business/${businessId}/export?days=${days}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const asciiMatch = disposition.match(/filename="([^"]+)"/i);
    const filename = utf8Match
      ? decodeURIComponent(utf8Match[1])
      : asciiMatch?.[1] ?? `qalago-analytics-${businessId}.csv`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return filename;
  },

  analyticsSummary: (token: string, businessId: string, days = 30) =>
    api<AnalyticsSummary>(
      `/analytics/business/${businessId}/summary?days=${days}`,
      { token },
    ),

  analyticsTrends: (token: string, businessId: string, days = 7) =>
    api<AnalyticsTrends>(
      `/analytics/business/${businessId}/trends?days=${days}`,
      { token },
    ),

  listReviews: (token: string, businessId: string) =>
    api<ReviewRow[]>(`/reviews?businessId=${encodeURIComponent(businessId)}`, {
      token,
    }),

  replyReview: (token: string, reviewId: string, ownerReply: string) =>
    api<ReviewRow>(`/reviews/${reviewId}/reply`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ ownerReply }),
    }),

  getServiceMenu: (token: string, businessId: string) =>
    api<ServiceMenuManage>(`/service-menu/manage/${businessId}`, { token }),

  listManageMenuItems: (
    token: string,
    businessId: string,
    params?: {
      page?: number;
      limit?: number;
      sectionId?: string;
      search?: string;
    },
  ) => {
    const query = new URLSearchParams();
    if (params?.page != null) query.set('page', String(params.page));
    if (params?.limit != null) query.set('limit', String(params.limit));
    if (params?.sectionId) query.set('sectionId', params.sectionId);
    if (params?.search?.trim()) query.set('search', params.search.trim());
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return api<ManageMenuItemsPage>(
      `/service-menu/manage/${businessId}/items${suffix}`,
      { token },
    );
  },

  createMenuGroup: (
    token: string,
    data: { businessId: string; title: string; description?: string },
  ) =>
    api<ServiceMenuGroup>('/service-menu-groups', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  updateMenuGroup: (token: string, id: string, data: Record<string, unknown>) =>
    api<ServiceMenuGroup>(`/service-menu-groups/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  deleteMenuGroup: (token: string, id: string) =>
    api<void>(`/service-menu-groups/${id}`, { method: 'DELETE', token }),

  createMenuItem: (
    token: string,
    data: {
      businessId: string;
      groupId?: string;
      title: string;
      description?: string;
      price?: string;
    },
  ) =>
    api<ServiceMenuItem>('/service-items', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  updateMenuItem: (token: string, id: string, data: Record<string, unknown>) =>
    api<ServiceMenuItem>(`/service-items/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  deleteMenuItem: (token: string, id: string) =>
    api<void>(`/service-items/${id}`, { method: 'DELETE', token }),

  uploadImage: (token: string, file: File) =>
    uploadApi<{ url: string }>('/uploads', token, file),

  listBusinessImages: (token: string, businessId: string) =>
    api<BusinessImageRow[]>(`/uploads/business/${businessId}/images`, { token }),

  attachBusinessImage: (
    token: string,
    businessId: string,
    imageUrl: string,
    asCover = false,
  ) =>
    api<BusinessImageRow>(`/uploads/business/${businessId}`, {
      method: 'POST',
      token,
      body: JSON.stringify({ imageUrl, asCover }),
    }),

  deleteBusinessImage: (token: string, businessId: string, imageId: string) =>
    api<void>(`/uploads/business/${businessId}/images/${imageId}`, {
      method: 'DELETE',
      token,
    }),

  setBusinessCover: (token: string, businessId: string, imageId: string) =>
    api<BusinessRow>(`/uploads/business/${businessId}/images/${imageId}/cover`, {
      method: 'PATCH',
      token,
    }),

  listNotifications: (token: string) =>
    api<NotificationRow[]>('/notifications', { token }),

  unreadNotificationCount: (token: string) =>
    api<{ count: number }>('/notifications/unread-count', { token }),

  markNotificationRead: (token: string, id: string) =>
    api<void>(`/notifications/${id}/read`, { method: 'PATCH', token }),

  markAllNotificationsRead: (token: string) =>
    api<void>('/notifications/read-all', { method: 'PATCH', token }),

  listPlans: () => api<PlanCatalogRow[]>('/plans'),

  getBusinessPlan: (token: string, businessId: string) =>
    api<BusinessPlanStatus>(`/businesses/${businessId}/plan`, { token }),

  mockPlanCheckout: (token: string, businessId: string, tier: string) =>
    api<{
      success: boolean;
      mock: boolean;
      message: string;
      plan: BusinessPlanStatus;
    }>(`/businesses/${businessId}/plan/mock-checkout`, {
      method: 'POST',
      token,
      body: JSON.stringify({ tier }),
    }),

  listMonetizationProducts: (
    token: string,
    params: { businessId: string; citySlug?: string; categoryId?: string },
  ) => {
    const q = new URLSearchParams({ businessId: params.businessId });
    if (params.citySlug) q.set('citySlug', params.citySlug);
    if (params.categoryId) q.set('categoryId', params.categoryId);
    return api<MonetizationProduct[]>(`/monetization/products?${q}`, { token });
  },

  getMonetizationProduct: (
    token: string,
    code: string,
    params: { businessId: string; citySlug?: string; categoryId?: string },
  ) => {
    const q = new URLSearchParams({ businessId: params.businessId });
    if (params.citySlug) q.set('citySlug', params.citySlug);
    if (params.categoryId) q.set('categoryId', params.categoryId);
    return api<MonetizationProduct>(`/monetization/products/${encodeURIComponent(code)}?${q}`, {
      token,
    });
  },

  listMonetizationPackages: (token: string) =>
    api<MonetizationPackage[]>('/monetization/packages', { token }),

  monetizationQuote: (token: string, body: Record<string, unknown>) =>
    api<MonetizationQuote>('/monetization/quote', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  createMonetizationOrder: (token: string, body: Record<string, unknown>) =>
    api<MonetizationOrder>('/monetization/orders', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  listMonetizationOrders: (token: string, businessId: string) =>
    api<MonetizationOrder[]>(`/monetization/orders?businessId=${encodeURIComponent(businessId)}`, {
      token,
    }),

  getMonetizationOrder: (token: string, orderId: string) =>
    api<MonetizationOrder>(`/monetization/orders/${orderId}`, { token }),

  listMonetizationCampaigns: (token: string, businessId: string) =>
    api<MonetizationCampaign[]>(
      `/monetization/campaigns?businessId=${encodeURIComponent(businessId)}`,
      { token },
    ),

  getMonetizationCampaign: (token: string, campaignId: string) =>
    api<MonetizationCampaign>(`/monetization/campaigns/${campaignId}`, { token }),

  getMonetizationCampaignAnalytics: (
    token: string,
    campaignId: string,
    params?: { from?: string; to?: string },
  ) => {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return api<MonetizationCampaignAnalytics>(
      `/monetization/campaigns/${campaignId}/analytics${qs ? `?${qs}` : ''}`,
      { token },
    );
  },

  createMonetizationCreative: (token: string, body: CreateMonetizationCreativePayload) =>
    api<MonetizationCreative>('/monetization/creatives', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  listMonetizationCreatives: (token: string, businessId: string) =>
    api<MonetizationCreative[]>(
      `/monetization/creatives?businessId=${encodeURIComponent(businessId)}`,
      { token },
    ),

  getMonetizationCreative: (token: string, creativeId: string) =>
    api<MonetizationCreative>(`/monetization/creatives/${creativeId}`, { token }),

  submitMonetizationCreative: (token: string, creativeId: string) =>
    api<MonetizationCreative>(`/monetization/creatives/${creativeId}/submit`, {
      method: 'POST',
      token,
    }),

  updateMonetizationCreative: (
    token: string,
    creativeId: string,
    body: Partial<CreateMonetizationCreativePayload>,
  ) =>
    api<MonetizationCreative>(`/monetization/creatives/${creativeId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    }),

  searchPublicBusinesses: (citySlug: string, search: string, limit = 20) => {
    const qs = new URLSearchParams({ citySlug, limit: String(limit) });
    if (search.trim()) qs.set('search', search.trim());
    return api<{ items: BusinessRow[]; meta: { page: number; limit: number; total: number } }>(
      `/businesses?${qs.toString()}`,
    );
  },

  listMyApplications: (token: string) =>
    api<BusinessApplicationRow[]>('/business-applications/my', { token }),

  getApplication: (token: string, id: string) =>
    api<BusinessApplicationRow>(`/business-applications/${id}`, { token }),

  createApplication: (
    token: string,
    data: {
      title?: string;
      categoryId?: string;
      citySlug?: string;
      address?: string;
      shortDesc?: string;
      phone?: string;
    },
  ) =>
    api<BusinessApplicationRow>('/business-applications', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  updateApplication: (
    token: string,
    id: string,
    data: {
      title?: string;
      categoryId?: string;
      citySlug?: string;
      address?: string;
      shortDesc?: string;
      phone?: string;
    },
  ) =>
    api<BusinessApplicationRow>(`/business-applications/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  submitApplication: (token: string, id: string) =>
    api<BusinessApplicationRow>(`/business-applications/${id}/submit`, {
      method: 'POST',
      token,
    }),

  cancelApplication: (token: string, id: string) =>
    api<BusinessApplicationRow>(`/business-applications/${id}/cancel`, {
      method: 'POST',
      token,
    }),

  listMyClaims: (token: string, page = 1, limit = 20) =>
    api<{ items: OwnershipClaimRow[]; meta: { page: number; limit: number; total: number } }>(
      `/ownership-claims/my?page=${page}&limit=${limit}`,
      { token },
    ),

  getClaim: (token: string, id: string) =>
    api<OwnershipClaimRow>(`/ownership-claims/${id}`, { token }),

  createOwnershipClaim: (
    token: string,
    businessId: string,
    body: { claimantMessage?: string } = {},
  ) =>
    api<OwnershipClaimRow>(`/businesses/${encodeURIComponent(businessId)}/ownership-claims`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  cancelOwnershipClaim: (token: string, id: string) =>
    api<OwnershipClaimRow>(`/ownership-claims/${id}/cancel`, {
      method: 'POST',
      token,
    }),
};

export type BusinessApplicationRow = {
  id: string;
  title: string;
  address: string;
  shortDesc?: string | null;
  phone?: string | null;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  city?: CityRow & { launchStatus?: string };
  category?: CategoryRow;
  approvedBusiness?: { id: string; title: string; slug: string; status: string } | null;
};

export type OwnershipClaimRow = {
  id: string;
  businessId: string;
  status: string;
  verificationMethod: string;
  claimantMessage?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  business?: {
    id: string;
    title: string;
    address: string;
    status: string;
    city?: CityRow;
  } | null;
};

export const TOKEN_KEY = 'qalago_business_token';
