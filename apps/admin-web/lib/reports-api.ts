import { api } from '@/lib/api-core';
import type { ReportNavId } from '@/lib/report-rbac';

const PATH: Record<ReportNavId, string> = {
  overview: '/admin/reports/overview',
  users: '/admin/reports/users',
  businesses: '/admin/reports/businesses',
  cities: '/admin/reports/cities',
  categories: '/admin/reports/categories',
  search: '/admin/reports/search',
  activity: '/admin/reports/activity',
  reviews: '/admin/reports/reviews',
  promotions: '/admin/reports/promotions',
  ads: '/admin/reports/ads',
  plans: '/admin/reports/plans',
  moderation: '/admin/reports/moderation',
  finance: '/admin/reports/finance',
  staff: '/admin/reports/staff',
  audit: '/admin/reports/audit',
  security: '/admin/reports/security',
  system: '/admin/reports/system',
};

export async function fetchReport(
  token: string,
  reportId: ReportNavId,
  query?: Record<string, string | undefined>,
): Promise<unknown> {
  const path = PATH[reportId];
  const qs = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v) qs.set(k, v);
    }
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return api(`${path}${suffix}`, { token });
}
