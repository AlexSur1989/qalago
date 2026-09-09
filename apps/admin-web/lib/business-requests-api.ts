import { api } from './api-core';
import type { ListMeta } from './api';

export type BusinessApplicationRow = {
  id: string;
  applicantUserId: string;
  cityId: string;
  categoryId: string;
  title: string;
  shortDesc?: string | null;
  address: string;
  phone?: string | null;
  status: string;
  rejectionReason?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  approvedBusinessId?: string | null;
  createdAt: string;
  updatedAt: string;
  city?: { id: string; slug: string; nameRu: string; launchStatus?: string } | null;
  category?: { id: string; title: string; slug: string } | null;
  approvedBusiness?: { id: string; title: string; slug: string; status: string } | null;
  applicant?: { id: string; name: string | null; role: string } | null;
  reviewedBy?: { id: string; name: string | null; role: string } | null;
};

export type BusinessOwnershipClaimRow = {
  id: string;
  businessId: string;
  claimantUserId: string;
  status: string;
  verificationMethod: string;
  claimantMessage?: string | null;
  rejectionReason?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  business?: {
    id: string;
    title: string;
    address: string;
    status: string;
    cityId: string;
    city?: { id: string; slug: string; nameRu: string } | null;
  } | null;
  claimant?: { id: string; name: string | null; role: string } | null;
  reviewedBy?: { id: string; name: string | null; role: string } | null;
};

export type ApproveApplicationResult = {
  application: BusinessApplicationRow;
  business: { id: string; title: string; slug: string; status: string; ownerId?: string | null };
};

export type ApproveClaimResult = {
  claim: BusinessOwnershipClaimRow;
  business: {
    id: string;
    title: string;
    address: string;
    status: string;
    ownerId?: string | null;
    planTier?: string;
  };
};

function listQuery(params: {
  page?: number;
  limit?: number;
  status?: string;
  citySlug?: string;
  businessId?: string;
}): string {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.status) qs.set('status', params.status);
  if (params.citySlug) qs.set('citySlug', params.citySlug);
  if (params.businessId) qs.set('businessId', params.businessId);
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const businessRequestsApi = {
  listApplications: (
    token: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      citySlug?: string;
    } = {},
  ) =>
    api<{ items: BusinessApplicationRow[]; meta: ListMeta }>(
      `/admin/business-applications${listQuery(params)}`,
      { token },
    ),

  getApplication: (token: string, id: string) =>
    api<BusinessApplicationRow>(`/admin/business-applications/${id}`, { token }),

  approveApplication: (token: string, id: string) =>
    api<ApproveApplicationResult>(`/admin/business-applications/${id}/approve`, {
      method: 'POST',
      token,
    }),

  rejectApplication: (
    token: string,
    id: string,
    body: { rejectionReason: string },
  ) =>
    api<BusinessApplicationRow>(`/admin/business-applications/${id}/reject`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  listClaims: (
    token: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      citySlug?: string;
      businessId?: string;
    } = {},
  ) =>
    api<{ items: BusinessOwnershipClaimRow[]; meta: ListMeta }>(
      `/admin/ownership-claims${listQuery(params)}`,
      { token },
    ),

  getClaim: (token: string, id: string) =>
    api<BusinessOwnershipClaimRow>(`/admin/ownership-claims/${id}`, { token }),

  approveClaim: (token: string, id: string) =>
    api<ApproveClaimResult>(`/admin/ownership-claims/${id}/approve`, {
      method: 'POST',
      token,
    }),

  rejectClaim: (token: string, id: string, body: { rejectionReason: string }) =>
    api<BusinessOwnershipClaimRow>(`/admin/ownership-claims/${id}/reject`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
};
