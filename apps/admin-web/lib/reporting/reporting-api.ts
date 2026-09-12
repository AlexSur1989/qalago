import { api } from '@/lib/api-core';
import type { ReportNavId } from '@/lib/report-rbac';
import type { ReportQueryParams } from './filters';
import type {
  BusinessesReport,
  FinanceReport,
  OverviewReport,
  PlansReport,
  SearchReport,
} from './types';

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

function toQueryString(params?: ReportQueryParams): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function fetchReport<T = unknown>(
  token: string,
  reportId: ReportNavId,
  params?: ReportQueryParams,
  signal?: AbortSignal,
): Promise<T> {
  const path = `${PATH[reportId]}${toQueryString(params)}`;
  return api<T>(path, { token, signal });
}

export async function fetchOverview(token: string, params?: ReportQueryParams, signal?: AbortSignal) {
  return fetchReport<OverviewReport>(token, 'overview', params, signal);
}

export async function fetchBusinessesReport(token: string, params?: ReportQueryParams, signal?: AbortSignal) {
  return fetchReport<BusinessesReport>(token, 'businesses', params, signal);
}

export async function fetchSearchReport(token: string, params?: ReportQueryParams, signal?: AbortSignal) {
  return fetchReport<SearchReport>(token, 'search', params, signal);
}

export async function fetchFinanceReport(token: string, params?: ReportQueryParams, signal?: AbortSignal) {
  return fetchReport<FinanceReport>(token, 'finance', params, signal);
}

export async function fetchPlansReport(token: string, params?: ReportQueryParams, signal?: AbortSignal) {
  return fetchReport<PlansReport>(token, 'plans', params, signal);
}

export async function fetchStaffMember(
  token: string,
  userId: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  return api<Record<string, unknown>>(`/admin/reports/staff/${userId}`, { token, signal });
}

export async function fetchStaffAnomalies(token: string, signal?: AbortSignal) {
  return api<{ windowHours: number; signals: unknown[] }>('/admin/reports/staff/anomalies', {
    token,
    signal,
  });
}

export async function downloadReportCsv(
  token: string,
  report: string,
  params?: ReportQueryParams,
): Promise<{ blob: Blob; filename: string }> {
  const qs = new URLSearchParams({ report, format: 'csv' });
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  if (params?.cityId) qs.set('cityId', params.cityId);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';
  const res = await fetch(`${API_BASE}/admin/reports/export?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const from = params?.from ?? 'period';
  const to = params?.to ?? 'end';
  return { blob, filename: `qalago-report-${report}-${from}-${to}.csv` };
}
