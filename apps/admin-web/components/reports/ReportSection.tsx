'use client';

import { ReactNode } from 'react';

export function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="report-section card">
      <h2 className="report-section-title">{title}</h2>
      {children}
    </section>
  );
}
