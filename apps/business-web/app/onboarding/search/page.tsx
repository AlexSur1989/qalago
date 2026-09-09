'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { BusinessRow, ownerApi } from '@/lib/api';
import { OnboardingShell } from '@/components/onboarding-shell';
import { mapOnboardingError } from '@/lib/onboarding-utils';

export default function OnboardingSearchPage() {
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
      setError(mapOnboardingError(String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell title="Найти свой бизнес" subtitle="Поиск по названию и адресу в выбранном городе.">
      <form onSubmit={search} className="form-grid" style={{ marginBottom: 20 }}>
        <label>
          Город
          <input value={citySlug} onChange={(e) => setCitySlug(e.target.value)} placeholder="uralsk" />
        </label>
        <label>
          Название или адрес
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Coffee Boom"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Поиск…' : 'Искать'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {searched && items.length === 0 && (
        <div className="empty-state">
          <p>Не нашли свой бизнес?</p>
          <Link href="/onboarding/apply" className="btn btn-primary">
            Добавить новый бизнес
          </Link>
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
              <Link href={`/onboarding/claim/${item.id}`} className="btn btn-sm btn-primary">
                Подтвердить права
              </Link>
            </li>
          ))}
        </ul>
      )}
    </OnboardingShell>
  );
}
