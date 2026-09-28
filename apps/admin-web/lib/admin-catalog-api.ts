import { api } from './api-core';
import type { AdminBusinessLocationRow } from './admin-business-locations-api';

export type AdminCatalogSubcategoryRow = {
  id: string;
  categoryId: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type AdminCatalogBusinessDetail = {
  id: string;
  title: string;
  slug: string;
  status: string;
  ownerId: string | null;
  owner?: { id: string; phone: string; name: string | null } | null;
  category: { id: string; title: string; slug: string };
  shortDesc?: string | null;
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  website?: string | null;
  workHours?: Record<string, string> | null;
  planTier?: string;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  city?: { slug: string; nameRu: string; nameKk?: string | null } | null;
  subcategories: AdminCatalogSubcategoryRow[];
};

export type AdminCatalogCreateResponse = {
  business: {
    id: string;
    title: string;
    slug: string;
    status: string;
    ownerId: string | null;
    categoryId: string;
  };
  primaryLocation: AdminBusinessLocationRow;
  subcategories: AdminCatalogSubcategoryRow[];
};

export type AdminCatalogListItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  ownerId?: string | null;
  category?: { id: string; title: string; slug: string } | null;
  city?: { slug: string; nameRu: string } | null;
  isFeatured?: boolean;
  planTier?: string;
  createdAt?: string;
};

export const adminCatalogApi = {
  listBusinesses: (
    token: string,
    params: { citySlug?: string; status?: string; page?: number; limit?: number } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.citySlug) qs.set('citySlug', params.citySlug);
    if (params.status) qs.set('status', params.status);
    qs.set('page', String(params.page ?? 1));
    qs.set('limit', String(params.limit ?? 20));
    return api<{ items: AdminCatalogListItem[]; meta: { page: number; limit: number; total: number } }>(
      `/admin/businesses?${qs}`,
      { token },
    );
  },

  getBusiness: (token: string, id: string) =>
    api<AdminCatalogBusinessDetail>(`/admin/businesses/${encodeURIComponent(id)}`, { token }),

  listLocations: (token: string, businessId: string) =>
    api<{ items: AdminBusinessLocationRow[] }>(
      `/admin/businesses/${encodeURIComponent(businessId)}/locations`,
      { token },
    ),

  createBusiness: (token: string, body: Record<string, unknown>) =>
    api<AdminCatalogCreateResponse>('/admin/businesses', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  patchCatalog: (token: string, id: string, body: Record<string, unknown>) =>
    api<AdminCatalogBusinessDetail>(`/admin/businesses/${encodeURIComponent(id)}/catalog`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    }),
};
