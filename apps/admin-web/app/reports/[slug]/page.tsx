'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { reportHref, type ReportNavId } from '@/lib/report-rbac';

const SLUGS = new Set<ReportNavId>([
  'users',
  'businesses',
  'cities',
  'categories',
  'search',
  'activity',
  'reviews',
  'promotions',
  'ads',
  'plans',
  'moderation',
  'finance',
  'staff',
  'audit',
  'security',
  'system',
]);

export default function LegacyReportSlugRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug ?? '');

  useEffect(() => {
    if (SLUGS.has(slug as ReportNavId)) {
      router.replace(reportHref(slug as ReportNavId));
    } else {
      router.replace('/reports');
    }
  }, [slug, router]);

  return null;
}
