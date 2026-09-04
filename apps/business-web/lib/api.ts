const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export type CategoryRow = {
  id: string;
  title: string;
  slug: string;
  icon?: string | null;
};

export type CreateBusinessPayload = {
  title: string;
  categoryId: string;
  citySlug: string;
  address: string;
  shortDesc?: string;
  phone?: string;
};

export type AuthUser = {
  id: string;
  phone: string;
  name: string | null;
  role: string;
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
  createdAt?: string;
  updatedAt?: string;
  city?: { slug: string; nameRu: string } | null;
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

export const SELECTED_BUSINESS_KEY = 'qalago_business_id';

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

  verifyCode: (phone: string, code: string) =>
    api<{ accessToken: string; user: AuthUser }>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  getMe: (token: string) => api<AuthUser>('/users/me', { token }),

  updateMe: (token: string, data: { name?: string; preferredCityId?: string }) =>
    api<AuthUser>('/users/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  listCategories: () => api<CategoryRow[]>('/categories'),

  createBusiness: (token: string, data: CreateBusinessPayload) =>
    api<BusinessRow>('/businesses', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  listMyBusinesses: (token: string) =>
    api<BusinessRow[]>('/businesses/my', { token }),

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
};

export const TOKEN_KEY = 'qalago_business_token';
