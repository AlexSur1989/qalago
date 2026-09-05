import { api } from './api-core';

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type MonetizationOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  businessId?: string;
  business?: {
    id: string;
    title: string;
    city: { slug: string; nameRu: string };
  };
  items: Array<{
    id: string;
    productCode: string;
    productName: string;
    productType: string;
    quantity: number;
    basePrice: number;
    discountPercent: number;
    discountAmount: number;
    finalPrice: number;
    durationHours: number | null;
    durationDays: number | null;
    metadata: Record<string, unknown> | null;
  }>;
  payments?: Array<{
    id: string;
    status: string;
    provider: string;
    amount: number;
    paidAt: string | null;
  }>;
};

export type MonetizationOrderDetail = MonetizationOrderRow & {
  business: {
    id: string;
    title: string;
    city: { slug: string; nameRu: string };
    category: { id: string; title: string; slug: string } | null;
  };
  campaigns: Array<{
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    product: { code: string; name: string };
    placements: Array<{ code: string; name: string }>;
  }>;
};

export type MonetizationPaymentRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  business: {
    id: string;
    title: string;
    city: { slug: string; nameRu: string };
  };
};

export type MonetizationCampaignRow = {
  id: string;
  businessId: string;
  businessTitle?: string;
  status: string;
  effectiveStatus: string;
  startAt: string;
  endAt: string;
  product: { code: string; name: string; type: string };
  creative?: { id: string; moderationStatus: string } | null;
  placements?: Array<{ code: string; name: string }>;
  metrics: {
    servedCount: number;
    qualifiedImpressions: number;
    clickCount: number;
  };
  cityId: string;
  categoryId: string | null;
};

export type CampaignAnalytics = {
  campaignId: string;
  period: { from: string | null; to: string | null };
  served: number;
  qualifiedImpressions: number;
  clicks: number;
  ctr: number;
  actions: Record<string, number>;
};

export type MonetizationCreativeRow = {
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
  business?: {
    id: string;
    title: string;
    city: { slug: string; nameRu: string };
  };
};

export type AdPlacementRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  maxVisible: number;
  maxActiveCampaigns: number;
  isActive: boolean;
};

export type MonetizationProductRow = {
  code: string;
  name: string;
  description: string | null;
  type: string;
  durations: Array<{
    durationDays?: number | null;
    durationHours?: number | null;
    basePrice: number;
    discountPercent: number;
    finalPrice: number;
    currency: string;
  }>;
};

export type MonetizationPackageRow = {
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  durationDays: number;
  discountPercent: number;
  items: Array<{
    productCode: string;
    productName: string;
    productType: string;
    durationDays: number | null;
    durationHours: number | null;
    quantity: number;
  }>;
};

export type ConfirmPaymentResult = {
  alreadyPaid: boolean;
  order: MonetizationOrderRow | null;
};

type ListParams = {
  citySlug?: string;
  status?: string;
  page?: number;
  limit?: number;
  businessId?: string;
  moderationStatus?: string;
};

function qs(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.citySlug) search.set('citySlug', params.citySlug);
  if (params.status) search.set('status', params.status);
  if (params.businessId) search.set('businessId', params.businessId);
  if (params.moderationStatus) search.set('moderationStatus', params.moderationStatus);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const s = search.toString();
  return s ? `?${s}` : '';
}

export const monetizationApi = {
  listOrders: (token: string, params: ListParams = {}) =>
    api<Paginated<MonetizationOrderRow>>(`/admin/monetization/orders${qs(params)}`, { token }),

  getOrder: (token: string, id: string) =>
    api<MonetizationOrderDetail>(`/admin/monetization/orders/${id}`, { token }),

  listPayments: (token: string, params: ListParams = {}) =>
    api<Paginated<MonetizationPaymentRow>>(`/admin/monetization/payments${qs(params)}`, { token }),

  getPayment: (token: string, id: string) =>
    api<MonetizationPaymentRow>(`/admin/monetization/payments/${id}`, { token }),

  confirmPayment: (token: string, id: string) =>
    api<ConfirmPaymentResult>(`/admin/monetization/payments/${id}/confirm`, {
      method: 'POST',
      token,
      body: JSON.stringify({}),
    }),

  listCampaigns: (token: string, params: ListParams = {}) =>
    api<Paginated<MonetizationCampaignRow>>(`/admin/monetization/campaigns${qs(params)}`, {
      token,
    }),

  getCampaign: (token: string, id: string) =>
    api<MonetizationCampaignRow>(`/admin/monetization/campaigns/${id}`, { token }),

  getCampaignAnalytics: (token: string, id: string) =>
    api<CampaignAnalytics>(`/admin/monetization/campaigns/${id}/analytics`, { token }),

  pauseCampaign: (token: string, id: string) =>
    api<MonetizationCampaignRow>(`/admin/monetization/campaigns/${id}/pause`, {
      method: 'POST',
      token,
      body: JSON.stringify({}),
    }),

  resumeCampaign: (token: string, id: string) =>
    api<MonetizationCampaignRow>(`/admin/monetization/campaigns/${id}/resume`, {
      method: 'POST',
      token,
      body: JSON.stringify({}),
    }),

  cancelCampaign: (token: string, id: string) =>
    api<MonetizationCampaignRow>(`/admin/monetization/campaigns/${id}/cancel`, {
      method: 'POST',
      token,
      body: JSON.stringify({}),
    }),

  listCreatives: (token: string, params: ListParams = {}) =>
    api<Paginated<MonetizationCreativeRow>>(`/admin/monetization/creatives${qs(params)}`, {
      token,
    }),

  getCreative: (token: string, id: string) =>
    api<MonetizationCreativeRow>(`/admin/monetization/creatives/${id}`, { token }),

  approveCreative: (token: string, id: string) =>
    api<MonetizationCreativeRow>(`/admin/monetization/creatives/${id}/approve`, {
      method: 'POST',
      token,
      body: JSON.stringify({}),
    }),

  rejectCreative: (token: string, id: string, moderationComment?: string) =>
    api<MonetizationCreativeRow>(`/admin/monetization/creatives/${id}/reject`, {
      method: 'POST',
      token,
      body: JSON.stringify({ moderationComment }),
    }),

  listPlacements: (token: string) =>
    api<AdPlacementRow[]>('/admin/monetization/placements', { token }),

  listProducts: (token: string, citySlug?: string) => {
    const params = citySlug ? `?citySlug=${encodeURIComponent(citySlug)}` : '';
    return api<MonetizationProductRow[]>(`/monetization/products${params}`, { token });
  },

  listPackages: (token: string) =>
    api<MonetizationPackageRow[]>('/monetization/packages', { token }),
};
