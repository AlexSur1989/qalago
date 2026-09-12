import { api } from './api-core';
import type { ListMeta } from './api';

export type LegalDocumentRow = {
  id: string;
  type: string;
  version: string;
  locale: string;
  title: string;
  content: string;
  status: string;
  requiresReacceptance: boolean;
  effectiveAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DataRightsRequestRow = {
  id: string;
  userId: string;
  type: string;
  status: string;
  reasonCode?: string | null;
  adminNote?: string | null;
  requestedAt: string;
  verifiedAt?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
};

export type GovernmentRequestRow = {
  id: string;
  referenceNumber?: string | null;
  requestingAuthority: string;
  requestType: string;
  status: string;
  receivedAt: string;
  verifiedAt?: string | null;
  dueAt?: string | null;
  assignedAdminId?: string | null;
  legalBasisNote?: string | null;
  responseSummary?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SecurityIncidentRow = {
  id: string;
  severity: string;
  status: string;
  title: string;
  summary?: string | null;
  detectedAt: string;
  containedAt?: string | null;
  resolvedAt?: string | null;
  ownerAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
};

function listQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      qs.set(key, String(value));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const legalApi = {
  listDocuments: (
    token: string,
    params: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
      locale?: string;
    } = {},
  ) =>
    api<{ items: LegalDocumentRow[]; meta: ListMeta }>(
      `/admin/legal/documents${listQuery(params)}`,
      { token },
    ),

  getDocument: (token: string, id: string) =>
    api<LegalDocumentRow>(`/admin/legal/documents/${id}`, { token }),

  listDataRequests: (
    token: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
    } = {},
  ) =>
    api<{ items: DataRightsRequestRow[]; meta: ListMeta }>(
      `/admin/legal/data-requests${listQuery(params)}`,
      { token },
    ),

  getDataRequest: (token: string, id: string) =>
    api<DataRightsRequestRow>(`/admin/legal/data-requests/${id}`, { token }),

  updateDataRequest: (
    token: string,
    id: string,
    body: { status?: string; adminNote?: string },
  ) =>
    api<DataRightsRequestRow>(`/admin/legal/data-requests/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    }),

  listGovernmentRequests: (
    token: string,
    params: { page?: number; limit?: number; status?: string } = {},
  ) =>
    api<{ items: GovernmentRequestRow[]; meta: ListMeta }>(
      `/admin/legal/government-requests${listQuery(params)}`,
      { token },
    ),

  listSecurityIncidents: (
    token: string,
    params: { page?: number; limit?: number; status?: string } = {},
  ) =>
    api<{ items: SecurityIncidentRow[]; meta: ListMeta }>(
      `/admin/legal/security-incidents${listQuery(params)}`,
      { token },
    ),
};
