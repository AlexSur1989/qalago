'use client';

import { useEffect, useRef, useState } from 'react';
import type { AppLocale } from '@/lib/locale';
import {
  businessLocationAdjustOnMap,
  businessLocationCancel,
  businessLocationConfirm,
  businessLocationGeocodingError,
  businessLocationMapLoadError,
  businessLocationOutOfCityBounds,
  businessLocationPickerHint,
  businessLocationRequired,
  branchManagementCopy,
} from '@/lib/presentation';
import {
  GeocodingOutOfCityError,
  geocodingAutocomplete,
  geocodingReverse,
  type GeocodingSuggestion,
} from '@/lib/geocoding-api';
import { LocationMapPicker } from './location-map-picker';
import { BackofficeField, BackofficeFieldGroup, BackofficeInput } from '@qalago/brand/forms';
import { BackofficeLoadingState } from '@qalago/brand/states';

export type BusinessLocationState = {
  address: string;
  latitude?: number;
  longitude?: number;
  locationSource?: 'GEOCODED' | 'MANUALLY_ADJUSTED';
};

type Props = {
  locale: AppLocale;
  token: string;
  citySlug: string;
  value: BusinessLocationState;
  onChange: (next: BusinessLocationState) => void;
  readOnly?: boolean;
  addressLabel: string;
};

function parseCoord(raw: string): number | undefined {
  const t = raw.trim().replace(',', '.');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function BusinessLocationField({
  locale,
  token,
  citySlug,
  value,
  onChange,
  readOnly = false,
  addressLabel,
}: Props) {
  const copy = branchManagementCopy(locale);
  const language = locale === 'kk' ? 'kk' : 'ru';
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestGen = useRef(0);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function scheduleAutocomplete(query: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const gen = ++requestGen.current;
      setLoading(true);
      setError(null);
      try {
        const items = await geocodingAutocomplete(token, {
          q: query.trim(),
          citySlug,
          language,
        });
        if (gen !== requestGen.current) return;
        setSuggestions(items);
      } catch {
        if (gen !== requestGen.current) return;
        setError(businessLocationGeocodingError(locale));
        setSuggestions([]);
      } finally {
        if (gen === requestGen.current) setLoading(false);
      }
    }, 320);
  }

  function selectSuggestion(item: GeocodingSuggestion) {
    onChange({
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      locationSource: 'GEOCODED',
    });
    setSuggestions([]);
    setShowPicker(true);
  }

  async function confirmPicker(lat: number, lng: number) {
    let next: BusinessLocationState = {
      ...value,
      latitude: lat,
      longitude: lng,
      locationSource: 'MANUALLY_ADJUSTED',
    };
    try {
      const reverse = await geocodingReverse(token, { lat, lng, citySlug, language });
      if (reverse?.address) {
        next = { ...next, address: reverse.address };
      }
    } catch (err) {
      if (err instanceof GeocodingOutOfCityError) {
        setError(businessLocationOutOfCityBounds(locale));
        return;
      }
    }
    onChange(next);
    setShowPicker(false);
  }

  const hasCoords =
    value.latitude != null &&
    value.longitude != null &&
    !(value.latitude === 0 && value.longitude === 0);

  const coordHint =
    !readOnly && !hasCoords && value.address.trim().length >= 2
      ? businessLocationRequired(locale)
      : undefined;

  const latStr = value.latitude != null ? String(value.latitude) : '';
  const lngStr = value.longitude != null ? String(value.longitude) : '';

  return (
    <div className="bo-form-grid bo-form-grid--1">
      <BackofficeField label={addressLabel} required error={error ?? coordHint}>
        {({ id, describedBy, invalid }) => (
          <BackofficeInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            value={value.address}
            disabled={readOnly}
            readOnly={readOnly}
            onChange={(e) => {
              onChange({ ...value, address: e.target.value });
              if (!readOnly) scheduleAutocomplete(e.target.value);
            }}
          />
        )}
      </BackofficeField>
      {loading ? <BackofficeLoadingState label="…" density="inline" /> : null}
      {suggestions.length > 0 && !readOnly && (
        <ul className="card" style={{ marginTop: 0, padding: 0, listStyle: 'none' }}>
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="btn btn-link"
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => selectSuggestion(item)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <>
          <p className="bo-field-label">{copy.mapSectionTitle}</p>
          <p className="bo-field-helper">{copy.coordinatesHelper}</p>
          <BackofficeFieldGroup columns="inline">
            <BackofficeField label={copy.latitudeLabel}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  inputMode="decimal"
                  value={latStr}
                  onChange={(e) => {
                    const latitude = parseCoord(e.target.value);
                    onChange({
                      ...value,
                      latitude,
                      locationSource: latitude != null ? 'MANUALLY_ADJUSTED' : value.locationSource,
                    });
                  }}
                />
              )}
            </BackofficeField>
            <BackofficeField label={copy.longitudeLabel}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  inputMode="decimal"
                  value={lngStr}
                  onChange={(e) => {
                    const longitude = parseCoord(e.target.value);
                    onChange({
                      ...value,
                      longitude,
                      locationSource: longitude != null ? 'MANUALLY_ADJUSTED' : value.locationSource,
                    });
                  }}
                />
              )}
            </BackofficeField>
          </BackofficeFieldGroup>
        </>
      )}

      {hasCoords && !readOnly && (
        <div>
          {showPicker ? (
            <LocationMapPicker
              latitude={value.latitude!}
              longitude={value.longitude!}
              title={copy.mapSectionTitle}
              hint={businessLocationPickerHint(locale)}
              mapLoadErrorLabel={businessLocationMapLoadError(locale)}
              confirmLabel={businessLocationConfirm(locale)}
              cancelLabel={businessLocationCancel(locale)}
              onConfirm={confirmPicker}
              onCancel={() => setShowPicker(false)}
            />
          ) : (
            <button type="button" className="btn btn-secondary" onClick={() => setShowPicker(true)}>
              {businessLocationAdjustOnMap(locale)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
