'use client';

import { FormEvent, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MFA_CONFIRM_BUTTON,
  MFA_QR_HINT,
  MFA_RECOVERY_WARNING,
  MFA_SETUP_INTRO,
  MFA_SETUP_TITLE,
  MFA_START_BUTTON,
  MFA_TOTP_INPUT_LABEL,
  MFA_TOTP_INPUT_PLACEHOLDER,
} from '@/lib/staff-mfa-enrollment-ui';
import { startStaffMfaEnroll, verifyStaffMfaEnroll } from '@/lib/staff-mfa-api';
import { setWebAccessToken } from '@/lib/web-auth-token';
import { BackofficeErrorState } from '@qalago/brand/states';
import { BackofficeField, BackofficeFormActions, BackofficeInput } from '@qalago/brand/forms';

type Props = {
  token: string;
  onEnrolled?: (recoveryCodes: string[]) => void;
  onComplete?: () => void;
};

export function StaffMfaEnrollment({ token, onEnrolled, onComplete }: Props) {
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totp, setTotp] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function begin() {
    setLoading(true);
    setError(null);
    try {
      const res = await startStaffMfaEnroll(token);
      setOtpauthUri(res.otpauthUri);
      setSecret(res.secret);
    } catch (e) {
      setError(formatEnrollError(e));
    } finally {
      setLoading(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await verifyStaffMfaEnroll(token, totp);
      if (res.accessToken) {
        setWebAccessToken(res.accessToken);
      }
      setRecoveryCodes(res.recoveryCodes);
      onEnrolled?.(res.recoveryCodes);
    } catch (err) {
      setError(formatEnrollError(err));
    } finally {
      setLoading(false);
    }
  }

  async function copyRecoveryCodes() {
    if (!recoveryCodes?.length) return;
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
    } catch {
      /* ignore */
    }
  }

  if (recoveryCodes) {
    return (
      <div className="login-card" style={{ maxWidth: 480 }}>
        <h1>Резервные коды</h1>
        <p className="muted">{MFA_RECOVERY_WARNING}</p>
        <ul style={{ fontFamily: 'monospace', lineHeight: 1.8 }}>
          {recoveryCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <button type="button" className="btn" onClick={() => void copyRecoveryCodes()}>
            Скопировать коды
          </button>
          <button type="button" className="btn btn-primary" onClick={onComplete}>
            Завершить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-card" style={{ maxWidth: 480 }}>
      <h1>{MFA_SETUP_TITLE}</h1>
      <p className="muted">{MFA_SETUP_INTRO}</p>
      {!otpauthUri ? (
        <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void begin()}>
          {MFA_START_BUTTON}
        </button>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
            <QRCodeSVG value={otpauthUri} size={200} aria-label="QR-код для Authenticator" />
          </div>
          <p className="muted" style={{ fontSize: 14 }}>
            {MFA_QR_HINT}
          </p>
          {secret ? (
            <p style={{ fontSize: 13, wordBreak: 'break-all' }}>
              Ключ для ручного ввода: <code>{secret}</code>
            </p>
          ) : null}
          <form onSubmit={confirm} className="bo-form-grid bo-form-grid--1">
            <BackofficeField label={MFA_TOTP_INPUT_LABEL} required helperText={MFA_TOTP_INPUT_PLACEHOLDER}>
              {({ id, describedBy, invalid }) => (
                <BackofficeInput
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              )}
            </BackofficeField>
            <BackofficeFormActions>
              <button type="submit" className="btn btn-primary" disabled={loading || totp.length !== 6} aria-busy={loading}>
                {MFA_CONFIRM_BUTTON}
              </button>
            </BackofficeFormActions>
          </form>
        </>
      )}
      {error ? <BackofficeErrorState message={error} /> : null}
    </div>
  );
}

function formatEnrollError(err: unknown): string {
  const raw = String(err);
  if (raw.toLowerCase().includes('mfa') && raw.toLowerCase().includes('encryption')) {
    return 'На сервере не настроён ключ шифрования MFA для catalog-api. Добавьте секрет в env API и перезапустите сервер.';
  }
  return raw;
}
