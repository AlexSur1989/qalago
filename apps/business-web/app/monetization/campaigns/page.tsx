'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MonetizationCampaign, ownerApi } from '@/lib/api';
import { useMonetizationContext } from '@/components/monetization/monetization-shell';
import {
  campaignOwnerGroupTitle,
  creativeStatusLabel,
  formatEffectivePeriod,
  monetizationStatusClass,
  parseApiError,
  placementLabel,
  productLabel,
  vipCampaignDisplayStatus,
} from '@/lib/monetization-utils';
import {
  campaignOwnerBucketOrder,
  groupCampaignsByOwnerBucket,
} from '@/lib/monetization-owner-ui';

function CampaignTable({
  campaigns,
  locale,
  ui,
}: {
  campaigns: MonetizationCampaign[];
  locale: ReturnType<typeof useLocale>;
  ui: ReturnType<typeof useUi>;
}) {
  return (
    <>
      <div className="table-scroll desktop-only">
        <table className="table">
          <thead>
            <tr>
              <th>{ui.text_c5ffa7}</th>
              <th>{ui.text_7203f7}</th>
              <th>{ui.text_382d73}</th>
              <th>{ui.text_f90bfb}</th>
              <th>{ui.text_c25cef}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const displayStatus = vipCampaignDisplayStatus(locale, c);
              return (
                <tr key={c.id}>
                  <td>{productLabel(locale, c.product?.code)}</td>
                  <td>
                    <span className={monetizationStatusClass(c.status)}>
                      {displayStatus}
                    </span>
                    {c.creative && c.product?.code === 'VIP_BANNER' && (
                      <div className="table-sub">
                        {creativeStatusLabel(locale, c.creative.moderationStatus)}
                      </div>
                    )}
                  </td>
                  <td>
                    {c.placements?.map((p) => placementLabel(locale, p.code, p.name ?? p.nameRu)).join(', ') ||
                      '—'}
                  </td>
                  <td>{formatEffectivePeriod(locale, c)}</td>
                  <td>{c.metrics?.qualifiedImpressions ?? 0}</td>
                  <td>
                    <Link href={`/monetization/campaigns/${c.id}`} className="btn btn-sm">{ui.text_e946df}</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mobile-only">
        {campaigns.map((c) => {
          const displayStatus = vipCampaignDisplayStatus(locale, c);
          return (
            <section key={c.id} className="form-card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{productLabel(locale, c.product?.code)}</strong>
                <span className={monetizationStatusClass(c.status)}>
                  {displayStatus}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {formatEffectivePeriod(locale, c)}
              </p>
              <Link href={`/monetization/campaigns/${c.id}`} className="btn btn-sm">{ui.text_59dca9}</Link>
            </section>
          );
        })}
      </div>
    </>
  );
}

export default function MonetizationCampaignsPage() {
  const locale = useLocale();
  const ui = useUi();

  const { token, business } = useMonetizationContext();
  const [campaigns, setCampaigns] = useState<MonetizationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ownerApi
      .listMonetizationCampaigns(token, business.id)
      .then((items) => {
        if (!cancelled) setCampaigns(items);
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
  }, [token, business.id, locale]);

  const grouped = useMemo(() => groupCampaignsByOwnerBucket(campaigns), [campaigns]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{ui.__f71231}</h1>
          <p className="page-header-meta">{ui.____bcabc8}</p>
        </div>
        <Link href="/monetization/products" className="btn btn-sm">{ui.__9b9ea3}</Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)' }}>{ui.text_89d69a}</p>}

      {!loading && campaigns.length === 0 && (
        <section className="form-card">
          <p style={{ color: 'var(--text-muted)' }}>{ui.___9d7a93}</p>
          <Link href="/monetization/products" className="btn btn-sm">{ui.__55b89b}</Link>
        </section>
      )}

      {!loading &&
        campaignOwnerBucketOrder().map((bucket) => {
          const items = grouped[bucket];
          if (items.length === 0) return null;
          return (
            <section key={bucket} className="form-card" style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>
                {campaignOwnerGroupTitle(locale, bucket)}
              </h2>
              <CampaignTable campaigns={items} locale={locale} ui={ui} />
            </section>
          );
        })}
    </>
  );
}
