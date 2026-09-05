'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MonetizationProduct, ownerApi } from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import { formatDuration, formatKzt, parseApiError, productLabel } from '@/lib/monetization-utils';

export default function MonetizationProductsPage() {
  const { token, business } = useMonetizationContext();
  const [products, setProducts] = useState<MonetizationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ownerApi
      .listMonetizationProducts(token, {
        businessId: business.id,
        citySlug: business.city?.slug,
        categoryId: business.categoryId,
      })
      .then((items) => {
        if (!cancelled) setProducts(items);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, business]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Рекламные продукты</h1>
          <p className="page-header-meta">Каталог размещений для {business.title}</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)' }}>Загрузка каталога…</p>}

      {!loading && products.length === 0 && (
        <section className="form-card">
          <p style={{ color: 'var(--text-muted)' }}>Продукты недоступны для вашего заведения.</p>
        </section>
      )}

      <div className="catalog-grid">
        {products.map((product) => {
          const minPrice = product.durations.reduce(
            (min, d) => (d.finalPrice < min ? d.finalPrice : min),
            product.durations[0]?.finalPrice ?? Infinity,
          );
          const minDuration = product.durations[0];
          return (
            <section key={product.code} className="form-card catalog-card">
              <h2 style={{ margin: '0 0 8px', fontSize: '1.05rem' }}>
                {productLabel(product.code)}
              </h2>
              {product.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{product.description}</p>
              )}
              {product.durations.length > 0 && (
                <p style={{ margin: '12px 0' }}>
                  от{' '}
                  <strong>
                    {formatKzt(minPrice, product.durations[0]?.currency ?? 'KZT')}
                  </strong>
                  {minDuration && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {' '}
                      / {formatDuration(minDuration.durationDays ?? null, minDuration.durationHours ?? null)}
                    </span>
                  )}
                </p>
              )}
              <Link href={`/monetization/products/${product.code}`} className="btn btn-sm">
                Настроить
              </Link>
            </section>
          );
        })}
      </div>
    </>
  );
}
