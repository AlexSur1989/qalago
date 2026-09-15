'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { BusinessRow, ownerApi } from '@/lib/api';
import { OnboardingShell } from '@/components/onboarding-shell';
import { mapOnboardingError } from '@/lib/onboarding-utils';

export default function OnboardingSearchPage() {
  const locale = useLocale();
  const ui = useUi();

  const [citySlug, setCitySlug] = useState('uralsk');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cities = await ownerApi.listCities();
      if (cities.length > 0 && !cities.some((c) => c.slug === citySlug)) {
        setCitySlug(cities[0].slug);
      }
      const res = await ownerApi.searchPublicBusinesses(citySlug, query);
      setItems(res.items);
      setSearched(true);
    } catch (err: unknown) {
      setError(mapOnboardingError(locale, String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell title={ui.___612420} subtitle={ui.____998d3a}>
      <form onSubmit={search} className="form-grid" style={{ marginBottom: 20 }}>
        <label>{ui.text_069c9c}<input value={citySlug} onChange={(e) => setCitySlug(e.target.value)} placeholder="uralsk" />
        </label>
        <label>{ui.___6f7ddf}<input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Coffee Boom"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? ui.text_6efd63 : ui.text_6ba3c7}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {searched && items.length === 0 && (
        <div className="empty-state">
          <p>{ui.____a8362b}</p>
          <Link href="/onboarding/apply" className="btn btn-primary">{ui.___61b180}</Link>
        </div>
      )}

      {items.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <li key={item.id} className="card card-muted">
              <strong>{item.title}</strong>
              <p className="muted" style={{ margin: '4px 0' }}>
                {item.address}
              </p>
              <Link href={`/onboarding/claim/${item.id}`} className="btn btn-sm btn-primary">{ui.__62b5a0}</Link>
            </li>
          ))}
        </ul>
      )}
    </OnboardingShell>
  );
}
