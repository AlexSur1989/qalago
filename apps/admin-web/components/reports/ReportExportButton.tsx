'use client';

import { useState } from 'react';
import type { ReportQueryParams } from '@/lib/reporting/filters';
import { downloadReportCsv } from '@/lib/reporting/reporting-api';

export function ReportExportButton({
  token,
  reportKey,
  params,
}: {
  token: string;
  reportKey: string;
  params: ReportQueryParams;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onExport() {
    setBusy(true);
    setErr(null);
    try {
      const { blob, filename } = await downloadReportCsv(token, reportKey, params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="report-export-wrap">
      <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={onExport}>
        {busy ? 'Экспорт…' : 'Экспорт CSV'}
      </button>
      {err ? <span className="report-export-error muted">{err}</span> : null}
    </span>
  );
}
