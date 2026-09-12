'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/use-auth';
import { canViewReport, type ReportNavId } from '@/lib/report-rbac';
import {
  paramsFromSearchParams,
  periodToRange,
  searchParamsFromParams,
  validateDateRange,
  type ReportQueryParams,
} from './filters';
import { fetchReport } from './reporting-api';

export function useReportPage<T>(reportId: ReportNavId) {
  const { token, user, ready } = useAuth('/login');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = useMemo(() => {
    const p = paramsFromSearchParams(searchParams);
    if (!p.from && !p.to) {
      const def = periodToRange('30d');
      return { ...p, from: def.from, to: def.to };
    }
    return p;
  }, [searchParams]);

  const validationError = validateDateRange(params.from, params.to);
  const allowed = user ? canViewReport(user.role, reportId) : false;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const setParams = useCallback(
    (next: Partial<ReportQueryParams>) => {
      const merged = { ...params, ...next };
      const qs = searchParamsFromParams(merged);
      router.replace(`${pathname}?${qs.toString()}`);
    },
    [params, pathname, router],
  );

  const load = useCallback(async () => {
    if (!token || !allowed || validationError) return;
    setLoading(true);
    setError(null);
    setForbidden(false);
    const controller = new AbortController();
    try {
      const result = await fetchReport<T>(token, reportId, params, controller.signal);
      setData(result);
      setUpdatedAt(new Date());
    } catch (e) {
      const msg = String(e);
      if (msg.includes('403') || msg.includes('Forbidden')) {
        setForbidden(true);
      } else {
        setError(msg);
      }
      setData(null);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [token, allowed, validationError, reportId, params]);

  useEffect(() => {
    if (!ready) return;
    if (!user || !allowed) return;
    void load();
  }, [ready, user, allowed, load]);

  return {
    ready,
    user,
    token,
    allowed,
    params,
    setParams,
    validationError,
    data,
    loading,
    error,
    forbidden,
    updatedAt,
    refresh: load,
  };
}
