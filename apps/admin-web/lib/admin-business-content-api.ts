import { api } from './api-core';
import type { StaffBranchScope } from './staff-branch-content-labels';

export type AdminBusinessContentResponse = {
  business: {
    id: string;
    title: string;
    city?: { slug: string; nameRu: string; nameKk?: string | null } | null;
  };
  serviceItems: Array<{
    id: string;
    title: string;
    isActive: boolean;
    sortOrder: number;
    section: { id: string; title: string; sortOrder: number } | null;
    branchScope: StaffBranchScope;
  }>;
  promotions: Array<{
    id: string;
    title: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    moderationHidden: boolean;
    branchScope: StaffBranchScope;
  }>;
};

export const adminBusinessContentApi = {
  getContent: (token: string, businessId: string) =>
    api<AdminBusinessContentResponse>(
      `/admin/businesses/${encodeURIComponent(businessId)}/content`,
      { token },
    ),
};
