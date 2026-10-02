import { api } from './api-core';

export type AdminPlanPaymentRow = {
  id: string;
  businessId: string;
  tier: string;
  amountKzt: number;
  periodDays: number | null;
  status: string;
  isMock: boolean;
  provider: string;
  providerReference: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  business: {
    id: string;
    title: string;
    city: { slug: string; nameRu: string } | null;
  };
};

export type AdminPlanPaymentsPage = {
  items: AdminPlanPaymentRow[];
  total: number;
  page: number;
  limit: number;
};

export const plansAdminApi = {
  listPayments: (
    token: string,
    params: { citySlug?: string; status?: string; page?: number; limit?: number } = {},
  ) => {
    const search = new URLSearchParams();
    if (params.citySlug) search.set('citySlug', params.citySlug);
    if (params.status) search.set('status', params.status);
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    const q = search.toString();
    return api<AdminPlanPaymentsPage>(`/admin/plans/payments${q ? `?${q}` : ''}`, { token });
  },

  confirmPayment: (token: string, id: string) =>
    api<{ alreadyCompleted: boolean; payment: AdminPlanPaymentRow }>(
      `/admin/plans/payments/${id}/confirm`,
      { method: 'POST', token, body: JSON.stringify({}) },
    ),

  cancelPayment: (token: string, id: string) =>
    api<{ payment: AdminPlanPaymentRow }>(`/admin/plans/payments/${id}/cancel`, {
      method: 'POST',
      token,
      body: JSON.stringify({}),
    }),
};
