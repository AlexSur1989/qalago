'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import { parseApiError } from '@/lib/monetization-utils';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ownerApi } from '@/lib/api';
import { BusinessShell } from '@/components/business-shell';
import { BusinessSectionAccessDenied } from '@/components/business-section-access-denied';
import { BUSINESS_ROUTE_ACCESS, useBusinessRouteGate } from '@/lib/use-business-route-gate';

export default function SettingsPage() {
  const locale = useLocale();
  const ui = useUi();

  const {
    token,
    user,
    ready,
    logout,
    business,
    businesses,
    allowed: routeAllowed,
  } = useBusinessRouteGate(BUSINESS_ROUTE_ACCESS.settings);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  async function saveAccount(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await ownerApi.updateMe(token, {
        name: name.trim() || undefined,
      });
      setName(updated.name ?? '');
      setMessage(ui.___6b48a6);
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

  return (
    <BusinessShell
      activeNav="settings"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      {!routeAllowed ? (
        <BusinessSectionAccessDenied />
      ) : (
        <>
      <header className="page-header">
        <div>
          <h1>{ui.ownerNavSettings}</h1>
          <p className="page-header-meta">{ui.____c8085a}</p>
        </div>
        <Link href="/dashboard" className="btn">{ui.__65f9d8}</Link>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <section className="form-card" style={{ maxWidth: 560, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>{ui.text_a1ceab}</h3>
        <form onSubmit={saveAccount} className="form-grid">
          <label>{ui.text_2928e1}<input value={user?.phone ?? ui.___68cbb0} readOnly disabled />
          </label>
          <label>{ui.__2ab419}<input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={ui.____bf2df1}
            />
          </label>
          <div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? ui.text_73dba4 : ui.text_74ea58}
            </button>
          </div>
        </form>
      </section>

      <section className="form-card" style={{ maxWidth: 560, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>{ui.text_4e3e1b}</h3>
        {business ? (
          <>
            <p style={{ margin: '0 0 12px', color: 'var(--text-muted)' }}>{ui.____6982ec}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href={`/business/${business.id}`} className="btn btn-primary">{ui.__a459d5}</Link>
              <Link href={`/business/${business.id}/media`} className="btn">{ui.___c89390}</Link>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 12px', color: 'var(--text-muted)' }}>{ui.____4e15ad}</p>
            <Link href="/onboarding" className="btn btn-primary">{ui.____3f2e2a}</Link>
          </>
        )}
      </section>

      <section className="form-card" style={{ maxWidth: 560 }}>
        <h3 style={{ marginTop: 0 }}>{ui.text_3677ee}</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          {ui.text_settingsAuthHint1}
          {ui.text_settingsAuthHint2}
        </p>
      </section>

      <section className="form-card" style={{ maxWidth: 560, marginTop: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>{ui.__288711}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/privacy" target="_blank" rel="noopener noreferrer">{ui.legalPrivacyLink}</Link>
          <Link href="/terms" target="_blank" rel="noopener noreferrer">{ui.legalTermsLink}</Link>
          <Link href="/account-deletion" target="_blank" rel="noopener noreferrer">{ui.legalAccountDeletionLink}</Link>
        </div>
      </section>
        </>
      )}
    </BusinessShell>
  );
}
