const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

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
  workHours?: Record<string, string> | null;
};

export type PromotionRow = {
  id: string;
  title: string;
  description?: string | null;
  discountText?: string | null;
  status: string;
  businessId: string;
};

export type AnalyticsSummary = {
  total: number;
  byType: Record<string, number>;
};

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
};

export const TOKEN_KEY = 'qalago_business_token';
