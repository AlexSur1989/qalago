'use client';

import type { ReactNode } from 'react';

export type LocationHoursRow = {
  id: string;
  label: string;
  control: ReactNode;
};

export function BackofficeLocationHoursGroup({ rows }: { rows: LocationHoursRow[] }) {
  return (
    <div className="bo-location-hours-rows">
      {rows.map((row) => (
        <div key={row.id} className="bo-location-hours-row">
          <div className="bo-location-hours-row__label">{row.label}</div>
          <div>{row.control}</div>
        </div>
      ))}
    </div>
  );
}
