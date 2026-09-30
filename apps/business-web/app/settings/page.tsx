'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import { parseApiError } from '@/lib/monetization-utils';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ownerApi } from '@/lib/api';
import { BusinessShell } from '@/components/business-shell';
import { BusinessSectionAccessDenied } from '@/components/business-section-access-denied';
import { BUSINESS_ROUTE_ACCESS, useBusinessRouteGate } from '@/lib/use-business-route-gate';
import { BackofficeAlert, BackofficeLoadingState, BackofficeSuccessState } from '@qalago/brand/states';
import {
  BackofficeField,
  BackofficeFormActions,
  BackofficeFormSection,
  BackofficeInput,
  useFormDirty,
  useUnsavedChangesGuard,
} from '@qalago/brand/forms';

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
  const { dirty, markClean } = useFormDirty(name);
  useUnsavedChangesGuard(dirty);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
      markClean(user.name);
    }
  }, [user?.name, markClean]);

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
      const nextName = updated.name ?? '';
      setName(nextName);
      markClean(nextName);
      setMessage(ui.___6b48a6);
    } catch (err) {
      setError(parseApiError(locale, err));
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !token) {
    return (
      <div className="page-content">
        <BackofficeLoadingState density="page" label={ui.text_89d69a} />
      </div>
    );
  }

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

      {error ? <BackofficeAlert variant="danger" message={error} /> : null}
      {message ? <BackofficeSuccessState message={message} /> : null}

      <section className="form-card" style={{ maxWidth: 560, marginBottom: 16 }}>
        <form onSubmit={saveAccount}>
          <BackofficeFormSection title={ui.text_a1ceab}>
            <BackofficeField label={ui.text_2928e1}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput id={id} aria-describedby={describedBy} invalid={invalid} value={user?.phone ?? ui.___68cbb0} readOnly disabled />
              )}
            </BackofficeField>
            <BackofficeField label={ui.__2ab419}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={ui.____bf2df1}
                />
              )}
            </BackofficeField>
            <BackofficeFormActions>
              <button type="submit" className="btn btn-primary" disabled={saving || !dirty}>
                {saving ? ui.text_73dba4 : ui.text_74ea58}
              </button>
            </BackofficeFormActions>
          </BackofficeFormSection>
        </form>
      </section>

      <section className="form-card" style={{ maxWidth: 560, marginBottom: 16 }}>
        <BackofficeFormSection title={ui.text_4e3e1b}>
          {business ? (
            <>
              <p className="bo-form-section-description">{ui.____6982ec}</p>
              <BackofficeFormActions>
                <Link href={`/business/${business.id}`} className="btn btn-primary">{ui.__a459d5}</Link>
                <Link href={`/business/${business.id}/media`} className="btn">{ui.___c89390}</Link>
              </BackofficeFormActions>
            </>
          ) : (
            <>
              <p className="bo-form-section-description">{ui.____4e15ad}</p>
              <Link href="/onboarding" className="btn btn-primary">{ui.____3f2e2a}</Link>
            </>
          )}
        </BackofficeFormSection>
      </section>

      <section className="form-card" style={{ maxWidth: 560 }}>
        <BackofficeFormSection title={ui.text_3677ee} description={`${ui.text_settingsAuthHint1}${ui.text_settingsAuthHint2}`}>
          <></>
        </BackofficeFormSection>
      </section>

      <section className="form-card" style={{ maxWidth: 560, marginTop: '1rem' }}>
        <BackofficeFormSection title={ui.__288711}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/privacy" target="_blank" rel="noopener noreferrer">{ui.legalPrivacyLink}</Link>
            <Link href="/terms" target="_blank" rel="noopener noreferrer">{ui.legalTermsLink}</Link>
            <Link href="/account-deletion" target="_blank" rel="noopener noreferrer">{ui.legalAccountDeletionLink}</Link>
          </div>
        </BackofficeFormSection>
      </section>
        </>
      )}
    </BusinessShell>
  );
}
