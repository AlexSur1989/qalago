import { api } from '@/lib/api-core';

export type StaffListRow = {
  id: string;
  userId: string;
  staffRole: string;
  isActive: boolean;
  disabledAt: string | null;
  mfaEnrolledAt: string | null;
  mfaRequired: boolean;
  createdAt: string;
  createdBy: { id: string; name: string | null } | null;
  user: {
    id: string;
    phone: string | null;
    name: string | null;
    createdAt: string;
  };
  cityScopes: { id: string; slug: string; nameRu: string }[];
  activeSessionCount: number;
};

export type StaffOverview = {
  total: number;
  active: number;
  disabled: number;
  rolesDistribution: { role: string; count: number }[];
  recentLogins: { userId: string; lastStaffLoginAt: string | null; staffRole: string }[];
};

export const staffApi = {
  list: (token: string) => api<StaffListRow[]>('/admin/staff', { token }),
  overview: (token: string) => api<StaffOverview>('/admin/staff/overview', { token }),
  detail: (token: string, userId: string) =>
    api<{ staff: unknown; auditHistory: unknown[] }>(`/admin/staff/${userId}`, { token }),
  disable: (token: string, userId: string) =>
    api<{ disabled: boolean }>(`/admin/staff/${userId}/disable`, { token, method: 'POST' }),
  restore: (token: string, userId: string) =>
    api<{ restored: boolean }>(`/admin/staff/${userId}/restore`, { token, method: 'POST' }),
  revokeSessions: (token: string, userId: string) =>
    api<{ revoked: boolean }>(`/admin/staff/${userId}/sessions/revoke-all`, {
      token,
      method: 'POST',
    }),
  updateRole: (token: string, userId: string, staffRole: string) =>
    api(`/admin/staff/${userId}/role`, {
      token,
      method: 'PUT',
      body: JSON.stringify({ staffRole }),
    }),
};
