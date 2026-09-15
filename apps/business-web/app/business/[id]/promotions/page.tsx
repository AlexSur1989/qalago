'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BusinessPlanStatus,
  BusinessRow,
  PromotionRow,
  findMyBusinessItem,
  myBusinessRows,
  ownerApi,
} from '@/lib/api';
import { canViewPayments } from '@/lib/business-access';
import { parseApiError } from '@/lib/monetization-utils';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell } from '@/components/business-shell';

export default function BusinessPromotionsPage() {
  const locale = useLocale();
  const ui = useUi();

  const params = useParams<{ id: string }>();
  const businessId = params.id;
  const { token, user, ready, logout, items: myBusinessItems } = useAuth();
  const access = findMyBusinessItem(myBusinessItems, businessId)?.access ?? null;
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [planStatus, setPlanStatus] = useState<BusinessPlanStatus | null>(null);
  const [title, setTitle] = useState('');
  const [discountText, setDiscountText] = useState('-20%');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const business = businesses.find((b) => b.id === businessId) ?? null;
  const activeCount = promotions.filter((p) => p.status === 'ACTIVE').length;
  const atActiveLimit =
    planStatus != null && activeCount >= planStatus.limits.maxActivePromotions;

  useEffect(() => {
    if (!token) return;
    ownerApi.listMyBusinesses(token).then((res) => setBusinesses(myBusinessRows(res.items))).catch((err) => setError(String(err)));
  }, [token]);

  async function load(t: string) {
    const promos = await ownerApi.listPromotions(t, businessId);
    setPromotions(promos.items);
    if (canViewPayments(access)) {
      setPlanStatus(await ownerApi.getBusinessPlan(t, businessId));
    } else {
      setPlanStatus(null);
    }
  }

  useEffect(() => {
    if (!token) return;
    load(token).catch((err) => setError(parseApiError(locale, err)));
  }, [token, businessId, access]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!token || !title.trim()) return;
    setError(null);
    try {
      await ownerApi.createPromotion(token, {
        businessId,
        title: title.trim(),
        discountText,
        description,
        status: 'ACTIVE',
      });
      setTitle('');
      setDescription('');
      await load(token);
    } catch (err) {
      setError(String(err));
    }
  }

  async function toggleStatus(p: PromotionRow) {
    if (!token) return;
    setError(null);
    try {
      const next = p.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
      await ownerApi.updatePromotion(token, p.id, { status: next });
      await load(token);
    } catch (err) {
      setError(String(err));
    }
  }

  async function remove(id: string) {
    if (!token) return;
    await ownerApi.deletePromotion(token, id);
    await load(token);
  }

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

  return (
    <BusinessShell
      activeNav="promotions"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>{ui.ownerMgmtPromotions}</h1>
          <p className="page-header-meta">{ui.____34c9f9}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn btn-ghost">{ui.text_76e286}</Link>
          <Link href="/monetization/products/PROMOTED_PROMOTION" className="btn btn-primary">{ui.__dd3834}</Link>
        </div>
      </header>

      {planStatus && (
        <section className="form-card" style={{ maxWidth: 720, marginBottom: 16 }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Тариф «{planStatus.catalog.nameRu}»: активных {activeCount} /{' '}
            {planStatus.limits.maxActivePromotions}
            {' · '}срок акции до {planStatus.limits.maxPromotionDurationDays} дн.
          </p>
          {planStatus.entitlements?.activePromotions.overLimit && (
            <p className="alert" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.88rem' }}>
              {planStatus.entitlements.overLimitNotice ?? ui.____b1060f}
            </p>
          )}
        </section>
      )}

      <form onSubmit={create} className="form-card form-grid" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>{ui.__404816}</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={ui.text_602680}
          disabled={atActiveLimit}
        />
        <input
          value={discountText}
          onChange={(e) => setDiscountText(e.target.value)}
          placeholder={ui.text_d90396}
          disabled={atActiveLimit}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={ui.text_38ca0a}
          rows={3}
          disabled={atActiveLimit}
        />
        <button type="submit" className="btn btn-primary" disabled={atActiveLimit}>
          {atActiveLimit ? ui.___c45ec6 : ui.__8062f8}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="form-card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Список ({promotions.length})</h2>
        {promotions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>{ui.___208573}</p>
        ) : (
          promotions.map((p) => (
            <div
              key={p.id}
              className="promo-item"
              style={{ alignItems: 'center' }}
            >
              <div className="promo-thumb">🏷️</div>
              <div className="promo-body">
                <strong>{p.title}</strong>
                {p.discountText && (
                  <p style={{ color: 'var(--primary)', margin: '4px 0' }}>{p.discountText}</p>
                )}
                {p.description && <p>{p.description}</p>}
                <span className={`tag ${p.status === 'ACTIVE' ? 'tag-success' : ''}`}>
                  {p.status === 'ACTIVE' ? ui.text_047e75 : p.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-sm" onClick={() => toggleStatus(p)}>
                  {p.status === 'ACTIVE' ? ui.text_b0e3a5 : ui.text_3e177a}
                </button>
                <button type="button" className="btn btn-sm" onClick={() => remove(p.id)}>{ui.text_ed2bbf}</button>
              </div>
            </div>
          ))
        )}
      </section>
    </BusinessShell>
  );
}
