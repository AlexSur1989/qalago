import { api } from './api-core';
import type { ListMeta } from './api';

export type ModerationCaseRow = {
  id: string;
  caseType: string;
  status: string;
  priority: string;
  targetType: string;
  targetId: string;
  cityId?: string | null;
  assignedAdminId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  city?: { id: string; slug: string; nameRu: string } | null;
  assignedAdmin?: { id: string; name: string | null; role: string } | null;
  reportCount?: number;
};

export type ContentReportRow = {
  id: string;
  reporterUserId?: string | null;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  reporter?: { id: string; name: string | null; phone?: string | null } | null;
};

export type ModerationActionRow = {
  id: string;
  caseId: string;
  actorAdminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  reasonCode?: string | null;
  internalNote?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  actorAdmin?: { id: string; name: string | null; role: string } | null;
};

export type ModerationCaseDetail = ModerationCaseRow & {
  targetSnapshot?: Record<string, unknown> | null;
  reports: ContentReportRow[];
  actions: ModerationActionRow[];
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

export const moderationApi = {
  listCases: (
    token: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      citySlug?: string;
    } = {},
  ) =>
    api<{ items: ModerationCaseRow[]; meta: ListMeta }>(
      `/admin/moderation/cases${listQuery(params)}`,
      { token },
    ),

  getCase: (token: string, id: string) =>
    api<ModerationCaseDetail>(`/admin/moderation/cases/${id}`, { token }),

  updateCase: (
    token: string,
    id: string,
    body: {
      status?: string;
      priority?: string;
      assignedAdminId?: string | null;
    },
  ) =>
    api<ModerationCaseRow>(`/admin/moderation/cases/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    }),

  recordAction: (
    token: string,
    caseId: string,
    body: {
      actionType: string;
      reasonCode?: string;
      internalNote?: string;
    },
  ) =>
    api<ModerationActionRow>(`/admin/moderation/cases/${caseId}/actions`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
};
