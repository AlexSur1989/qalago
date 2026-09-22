'use client';

import { useMemo } from 'react';
import { useLocale, useUi } from '@/components/locale-provider';
import type { BusinessLocationRow, CityRow } from '@/lib/api';
import {
  formatBranchAvailabilityLabel,
  knownSelectedLocationIds,
  missingBranchLocationIds,
  sortBranchLocations,
  toggleBranchLocationSelection,
  setBranchAvailabilityMode,
  type BranchAvailabilityUiState,
} from '@/lib/branch-availability';

type BranchAvailabilityFieldProps = {
  namePrefix: string;
  locations: BusinessLocationRow[];
  cities: CityRow[];
  locationsLoading?: boolean;
  value: BranchAvailabilityUiState;
  onChange: (next: BranchAvailabilityUiState) => void;
  disabled?: boolean;
  validationError?: string | null;
};

export function BranchAvailabilityField({
  namePrefix,
  locations,
  cities,
  locationsLoading = false,
  value,
  onChange,
  disabled = false,
  validationError = null,
}: BranchAvailabilityFieldProps) {
  const locale = useLocale();
  const ui = useUi();

  const branchLocations = useMemo(() => sortBranchLocations(locations), [locations]);
  const missingIds = useMemo(
    () => missingBranchLocationIds(value, branchLocations),
    [value, branchLocations],
  );
  const selectedKnown = useMemo(
    () => new Set(knownSelectedLocationIds(value, branchLocations)),
    [value, branchLocations],
  );

  const showBranchList = value.mode === 'SELECTED';
  const listId = `${namePrefix}-branch-list`;

  return (
    <fieldset
      disabled={disabled}
      style={{ border: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}
    >
      <legend style={{ fontWeight: 600, marginBottom: 4 }}>{ui.branchAvailabilityHeading}</legend>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'default' : 'pointer' }}>
        <input
          type="radio"
          name={`${namePrefix}-mode`}
          checked={value.mode === 'ALL'}
          onChange={() => onChange(setBranchAvailabilityMode(value, 'ALL'))}
        />
        <span>{ui.branchAvailabilityModeAll}</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'default' : 'pointer' }}>
        <input
          type="radio"
          name={`${namePrefix}-mode`}
          checked={value.mode === 'SELECTED'}
          onChange={() => onChange(setBranchAvailabilityMode(value, 'SELECTED'))}
        />
        <span>{ui.branchAvailabilityModeSelected}</span>
      </label>

      {locationsLoading ? (
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.mediaScopeLoadingLocations}</p>
      ) : showBranchList ? (
        branchLocations.length === 0 && missingIds.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{ui.branchAvailabilityNoBranches}</p>
        ) : (
          <div
            id={listId}
            style={{
              marginTop: 4,
              maxHeight: 220,
              overflowY: 'auto',
              border: '1px solid var(--border-subtle, #eceff3)',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'grid',
              gap: 8,
            }}
          >
            {branchLocations.map((location) => {
              const label = formatBranchAvailabilityLabel(
                locale,
                location,
                cities,
                ui.branchAvailabilityPrimaryBadge,
              );
              return (
                <label
                  key={location.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: disabled ? 'default' : 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedKnown.has(location.id)}
                    onChange={(e) =>
                      onChange(toggleBranchLocationSelection(value, location.id, e.target.checked))
                    }
                  />
                  <span>{label}</span>
                </label>
              );
            })}
            {missingIds.map((id) => (
              <p
                key={id}
                style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}
                role="status"
              >
                {ui.branchAvailabilityBranchUnavailable}
              </p>
            ))}
          </div>
        )
      ) : null}

      {validationError && (
        <p className="alert alert-error" style={{ margin: 0, fontSize: '0.88rem' }} role="alert">
          {validationError}
        </p>
      )}
    </fieldset>
  );
}
