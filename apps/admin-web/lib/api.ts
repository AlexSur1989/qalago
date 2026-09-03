const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export type AuthUser = {
  id: string;
  phone: string;
  name: string | null;
  role: string;
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

  listUsers: (token: string) =>
    api<AuthUser[]>('/admin/users', { token }),
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
