'use client';

import { useEffect, useRef, useState } from 'react';
import type { AppLocale } from '@/lib/locale';
import {
  businessLocationAdjustOnMap,
  businessLocationCancel,
  businessLocationConfirm,
  businessLocationGeocodingError,
  businessLocationOutOfCityBounds,
  businessLocationPickerHint,
  businessLocationRequired,
} from '@/lib/presentation';
import {
  GeocodingOutOfCityError,
  geocodingAutocomplete,
  geocodingReverse,
  type GeocodingSuggestion,
} from '@/lib/geocoding-api';
import { LocationMapPicker } from './location-map-picker';

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

export function BusinessLocationField({
  locale,
  token,
  citySlug,
  value,
  onChange,
  readOnly = false,
  addressLabel,
}: Props) {
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
    } catch (error) {
      if (error instanceof GeocodingOutOfCityError) {
        setError(businessLocationOutOfCityBounds(locale));
        return;
      }
      // coordinates authoritative for other reverse failures
    }
    onChange(next);
    setShowPicker(false);
  }

  const hasCoords =
    value.latitude != null &&
    value.longitude != null &&
    !(value.latitude === 0 && value.longitude === 0);

  return (
    <div>
      <label>
        {addressLabel}
        <input
          value={value.address}
          disabled={readOnly}
          onChange={(e) => {
            onChange({ ...value, address: e.target.value });
            if (!readOnly) scheduleAutocomplete(e.target.value);
          }}
        />
      </label>
      {loading && <p style={{ fontSize: 12 }}>…</p>}
      {error && <p className="alert alert-error" style={{ marginTop: 8 }}>{error}</p>}
      {suggestions.length > 0 && !readOnly && (
        <ul className="card" style={{ marginTop: 8, padding: 0, listStyle: 'none' }}>
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
      {!readOnly && !hasCoords && value.address.trim().length >= 2 && (
        <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>
          {businessLocationRequired(locale)}
        </p>
      )}
      {hasCoords && !readOnly && (
        <div style={{ marginTop: 12 }}>
          {showPicker ? (
            <LocationMapPicker
              latitude={value.latitude!}
              longitude={value.longitude!}
              hint={businessLocationPickerHint(locale)}
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
