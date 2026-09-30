'use client';

import { useLocale, useUi } from '@/components/locale-provider';
import Link from 'next/link';
import { FormEvent, Suspense, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ownerApi, AuthUser } from '@/lib/api';
import { resetBusinessAuthBootstrapState } from '@/lib/business-auth-bootstrap';
import { setWebAccessToken } from '@/lib/web-auth-token';
import {
  businessWebAnyLoginMethodConfigured,
  businessWebAppleAuthConfigured,
  businessWebDevLoginEnabled,
  businessWebGoogleAuthConfigured,
  businessWebGoogleClientId,
  businessWebOtpAuthConfigured,
  businessWebSocialAuthConfigured,
} from '@/lib/auth-config';
import { devSeedAccounts } from '@/lib/dev-seed-accounts';
import { resolvePostLoginDestination } from '@/lib/login-session';
import {
  exchangeAppleAuthorization,
  exchangeGoogleIdToken,
} from '@/lib/social-auth/social-auth-service';
import { mapSocialAuthError } from '@/lib/social-auth/social-auth-errors';
import { AppleLoginButton } from '@/components/social-login/apple-login-button';
import { GoogleLoginButton } from '@/components/social-login/google-login-button';
import { sanitizeInternalRedirect } from '@/lib/redirect-utils';
import { mapLoginRouteError, postLoginErrorMessage } from '@/lib/presentation';
import { LegalConsentFooter } from '@/components/legal-consent-footer';
import { loginNoBusinessPrompt } from '@/lib/owner-visual-copy';

export default function LoginPage() {
  const locale = useLocale();
  const ui = useUi();

  const inner = (
    <Suspense fallback={<main className="login-page"><p>{ui.text_89d69a}</p></main>}>
      <LoginContent />
    </Suspense>
  );

  if (businessWebGoogleAuthConfigured) {
    return (
      <GoogleOAuthProvider clientId={businessWebGoogleClientId}>
        {inner}
      </GoogleOAuthProvider>
    );
  }

  return inner;
}

function LoginContent() {
  const locale = useLocale();
  const ui = useUi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = sanitizeInternalRedirect(searchParams.get('redirect'), '/home');

  const [phone, setPhone] = useState('+77000000002');
  const [code, setCode] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpExpanded, setOtpExpanded] = useState(
    !businessWebSocialAuthConfigured && businessWebOtpAuthConfigured,
  );

  const finishLogin = useCallback(
    async (
      accessToken: string,
      refreshToken: string | undefined,
      user: AuthUser,
    ) => {
      const destination = await resolvePostLoginDestination(
        accessToken,
        user,
        redirectParam,
      );
      if (destination.errorKey) {
        setError(postLoginErrorMessage(locale, destination.errorKey));
        return;
      }
      resetBusinessAuthBootstrapState();
      setWebAccessToken(accessToken);
      if (refreshToken) {
        await fetch('/api/auth/business/establish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
      router.push(destination.path);
    },
    [locale, redirectParam, router],
  );

  async function loginViaSession(mode: 'verify' | 'dev', payload: { phone: string; code?: string }) {
    const res = await fetch('/api/auth/business/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        mode === 'dev'
          ? { mode: 'dev', phone: payload.phone }
          : { mode: 'verify', phone: payload.phone, code: payload.code },
      ),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json() as Promise<{ accessToken: string; user: AuthUser }>;
  }

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ownerApi.sendCode(phone);
      if (res.debugCode) {
        setDebugCode(res.debugCode);
        setCode(res.debugCode);
      }
    } catch (err) {
      setError(mapLoginRouteError(locale, err));
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await loginViaSession('verify', { phone, code });
      await finishLogin(res.accessToken, undefined, res.user);
    } catch (err) {
      setError(mapLoginRouteError(locale, err));
    } finally {
      setLoading(false);
    }
  }

  async function devLogin(nextPhone = phone) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await loginViaSession('dev', { phone: nextPhone });
      await finishLogin(res.accessToken, undefined, res.user);
    } catch (err) {
      setError(mapLoginRouteError(locale, err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await exchangeGoogleIdToken(credential);
      await finishLogin(res.accessToken, res.refreshToken, res.user);
    } catch (err) {
      const message = mapSocialAuthError(locale, err, 'Google');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleAuthorization(
    response: Parameters<typeof exchangeAppleAuthorization>[0],
  ) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await exchangeAppleAuthorization(response);
      await finishLogin(res.accessToken, res.refreshToken, res.user);
    } catch (err) {
      const message = mapSocialAuthError(locale, err, 'Apple');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1>QalaGo Business</h1>
        <p className="login-lead">
          {businessWebSocialAuthConfigured
            ? ui.____2146ba
            : businessWebOtpAuthConfigured
              ? ui.____c8191d
              : ui.____6e26fd}
        </p>

        {!businessWebAnyLoginMethodConfigured && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>{ui.____b0d344}</div>
        )}

        {businessWebGoogleAuthConfigured && (
          <GoogleLoginButton
            disabled={loading}
            onCredential={handleGoogleCredential}
            onError={() => setError(ui.____28d61d)}
          />
        )}

        {businessWebAppleAuthConfigured && (
          <AppleLoginButton
            disabled={loading}
            onAuthorization={handleAppleAuthorization}
          />
        )}

        {businessWebSocialAuthConfigured && businessWebOtpAuthConfigured && (
          <>
            <div className="login-divider">
              <span>{ui.text_7ed121}</span>
            </div>
            {!otpExpanded ? (
              <button
                type="button"
                className="btn"
                style={{ width: '100%' }}
                disabled={loading}
                onClick={() => setOtpExpanded(true)}
              >
                {ui.text_loginByPhone}
              </button>
            ) : (
              <>
                <form onSubmit={sendCode} className="form-grid" style={{ marginBottom: 24 }}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={ui.text_2928e1}
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading} className="btn btn-primary">{ui.__74bc05}</button>
                </form>
                {debugCode && (
                  <p style={{ color: 'var(--success)' }}>Dev OTP: {debugCode}</p>
                )}
                <form onSubmit={verify} className="form-grid">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={ui.__sms_82ec53}
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading} className="btn btn-primary">{ui.text_63a753}</button>
                </form>
              </>
            )}
          </>
        )}

        {!businessWebSocialAuthConfigured && businessWebOtpAuthConfigured && (
          <>
            <form onSubmit={sendCode} className="form-grid" style={{ marginBottom: 24 }}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={ui.text_2928e1}
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="btn btn-primary">{ui.__74bc05}</button>
            </form>
            {debugCode && <p style={{ color: 'var(--success)' }}>Dev OTP: {debugCode}</p>}
            <form onSubmit={verify} className="form-grid">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={ui.__sms_82ec53}
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="btn btn-primary">{ui.text_63a753}</button>
            </form>
          </>
        )}

        {businessWebDevLoginEnabled && (
          <>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 16, width: '100%' }}
              disabled={loading}
              onClick={() => devLogin()}
            >
              {ui.text_loginDevNoSms}
            </button>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {devSeedAccounts.map((account) => (
                <button
                  key={account.phone}
                  type="button"
                  className="btn"
                  disabled={loading}
                  onClick={() => {
                    setPhone(account.phone);
                    void devLogin(account.phone);
                  }}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        <LegalConsentFooter />

        <p style={{ marginTop: 20, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {loginNoBusinessPrompt(locale)}{' '}
          <Link href="/onboarding" style={{ color: 'var(--primary)' }}>{ui.___c1d1fc}</Link>
        </p>
      </div>
    </main>
  );
}
