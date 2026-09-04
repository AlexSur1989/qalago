'use client';

import { useEffect, useRef, useState } from 'react';
import { GeoPlaceSuggestion, adminApi } from '@/lib/api';

type CityNameAutocompleteProps = {
  token: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: GeoPlaceSuggestion) => void;
  placeholder?: string;
  required?: boolean;
};

export function CityNameAutocomplete({
  token,
  value,
  onChange,
  onSelect,
  placeholder,
  required,
}: CityNameAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GeoPlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await adminApi.searchGeoPlaces(token, value.trim());
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch (err) {
        setSuggestions([]);
        setOpen(false);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [token, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="autocomplete" ref={rootRef}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {loading && <span className="autocomplete-hint">Поиск…</span>}
      {error && !loading && <span className="autocomplete-hint autocomplete-error">Не удалось найти</span>}
      {open && suggestions.length > 0 && (
        <ul className="autocomplete-list" role="listbox">
          {suggestions.map((item) => (
            <li key={`${item.slugSuggestion}-${item.lat}-${item.lng}`}>
              <button
                type="button"
                className="autocomplete-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                <strong>{item.nameRu}</strong>
                <span>{item.displayName}</span>
                <span className="autocomplete-meta">
                  {item.lat.toFixed(4)}, {item.lng.toFixed(4)} · {item.timezone}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
