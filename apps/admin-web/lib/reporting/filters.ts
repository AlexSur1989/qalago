export const MAX_REPORT_RANGE_DAYS = 366;

export type PeriodPreset = 'today' | '7d' | '30d' | '90d' | 'custom';

export type ReportQueryParams = {
  from?: string;
  to?: string;
  cityId?: string;
  categoryId?: string;
  subcategoryId?: string;
  businessId?: string;
  status?: string;
  placement?: string;
  plan?: string;
  page?: string;
  limit?: string;
};

export function periodToRange(preset: PeriodPreset): { from: string; to: string } {
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  const from = new Date(to);
  switch (preset) {
    case 'today':
      from.setUTCHours(0, 0, 0, 0);
      break;
    case '7d':
      from.setUTCDate(from.getUTCDate() - 6);
      from.setUTCHours(0, 0, 0, 0);
      break;
    case '30d':
      from.setUTCDate(from.getUTCDate() - 29);
      from.setUTCHours(0, 0, 0, 0);
      break;
    case '90d':
      from.setUTCDate(from.getUTCDate() - 89);
      from.setUTCHours(0, 0, 0, 0);
      break;
    default:
      from.setUTCDate(from.getUTCDate() - 29);
      from.setUTCHours(0, 0, 0, 0);
  }
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function validateDateRange(from?: string, to?: string): string | null {
  if (!from || !to) return null;
  const f = new Date(from);
  const t = new Date(to);
  if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) {
    return 'Некорректные даты';
  }
  if (f > t) return 'Дата начала должна быть не позже даты окончания';
  const spanDays = (t.getTime() - f.getTime()) / (24 * 60 * 60 * 1000);
  if (spanDays > MAX_REPORT_RANGE_DAYS) {
    return `Период не может превышать ${MAX_REPORT_RANGE_DAYS} дней`;
  }
  return null;
}

export function paramsFromSearchParams(sp: URLSearchParams): ReportQueryParams {
  const keys = [
    'from',
    'to',
    'cityId',
    'categoryId',
    'subcategoryId',
    'businessId',
    'status',
    'placement',
    'plan',
    'page',
    'limit',
  ] as const;
  const out: ReportQueryParams = {};
  for (const k of keys) {
    const v = sp.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export function searchParamsFromParams(params: ReportQueryParams): URLSearchParams {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  return qs;
}
