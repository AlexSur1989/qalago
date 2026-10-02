'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MonetizationPackage, ownerApi } from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  formatDuration,
  formatKzt,
  packageHasVip,
  parseApiError,
  productLabel,
} from '@/lib/monetization-utils';
import { adPackagesNotSubscriptionPlans } from '@/lib/owner-visual-copy';

export default function MonetizationPackagesPage() {
  const locale = useLocale();
  const ui = useUi();

  const { token } = useMonetizationContext();
  const [packages, setPackages] = useState<MonetizationPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ownerApi
      .listMonetizationPackages(token)
      .then((items) => {
        if (!cancelled) setPackages(items);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiError(locale, err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{ui.__13dad9}</h1>
          <p className="page-header-meta">{ui.____724c24}</p>
          <p className="page-header-meta" style={{ marginTop: 4 }}>
            {adPackagesNotSubscriptionPlans(locale)}
          </p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)' }}>{ui.__798c20}</p>}

      {!loading && packages.length === 0 && (
        <section className="form-card">
          <p style={{ color: 'var(--text-muted)' }}>{ui.___e99e5d}</p>
        </section>
      )}

      <div className="catalog-grid">
        {packages.map((pkg) => (
          <section key={pkg.code} className="form-card catalog-card">
            <h2 style={{ margin: '0 0 8px' }}>{pkg.name}</h2>
            {pkg.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{pkg.description}</p>
            )}
            <p style={{ margin: '12px 0' }}>
              <strong>{formatKzt(pkg.price, pkg.currency)}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {' '}
                / {formatDuration(locale, pkg.durationDays, null)}
              </span>
            </p>
            <ul style={{ paddingLeft: 18, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {pkg.items.map((item, idx) => (
                <li key={`${item.productCode}-${idx}`}>
                  {productLabel(locale, item.productCode)}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </li>
              ))}
            </ul>
            {packageHasVip(pkg) && (
              <p style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>{ui._vip___93dfa0}</p>
            )}
            <Link href={`/monetization/packages/${pkg.code}`} className="btn btn-sm">{ui.text_db5f55}</Link>
          </section>
        ))}
      </div>
    </>
  );
}
