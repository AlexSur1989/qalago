const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';
const AI_BASE = process.env.NEXT_PUBLIC_AI_URL ?? 'http://localhost:3004/api/v1';

export type AuthUser = {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  managedCityId?: string | null;
  managedCity?: { slug: string; nameRu: string } | null;
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
  return res.json() as Promise<T>;
}

export const adminApi = {
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

  listBusinesses: (token: string, citySlug = 'uralsk', status?: string) => {
    const params = new URLSearchParams({ citySlug });
    if (status) params.set('status', status);
    return api<{ items: BusinessRow[] }>(`/admin/businesses?${params}`, { token });
  },

  updateStatus: (token: string, id: string, status: string) =>
    api(`/admin/businesses/${id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    }),

  updateFeatured: (token: string, id: string, isFeatured: boolean) =>
    api(`/admin/businesses/${id}/featured`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ isFeatured }),
    }),

  listUsers: (token: string) =>
    api<AuthUser[]>('/admin/users', { token }),

  updateUserRole: (token: string, id: string, role: string) =>
    api<AuthUser>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ role }),
    }),
};

export type EditorialDraft = {
  agent: string;
  citySlug: string;
  title: string;
  bodyMarkdown: string;
  businessIds: string[];
  source: string;
};

export const aiApi = {
  createContentDraft: (params: {
    citySlug: string;
    topic?: string;
    limit?: number;
  }) =>
    fetch(`${AI_BASE}/content/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      return res.json() as Promise<EditorialDraft>;
    }),
};

export type BusinessRow = {
  id: string;
  title: string;
  status: string;
  address: string;
  isFeatured: boolean;
  owner?: { phone: string; name: string | null };
  city?: { slug: string; nameRu: string };
};

export const TOKEN_KEY = 'qalago_admin_token';
