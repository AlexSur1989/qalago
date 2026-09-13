import type { StaffMfaStatus } from '@/lib/staff-mfa-api';

export const MFA_SETUP_TITLE = 'Настройка двухфакторной защиты';

export const MFA_SETUP_INTRO =
  'Для защиты административного аккаунта подключите приложение-аутентификатор.';

export const MFA_QR_HINT =
  'Отсканируйте QR-код в Google Authenticator, Microsoft Authenticator, 1Password или другом приложении TOTP.';

export const MFA_TOTP_INPUT_LABEL = '6-значный код из приложения';

export const MFA_TOTP_INPUT_PLACEHOLDER = 'Код из Authenticator';

export const MFA_START_BUTTON = 'Настроить Authenticator';

export const MFA_CONFIRM_BUTTON = 'Подтвердить';

export const MFA_RECOVERY_WARNING =
  'Сохраните резервные коды. После закрытия этой страницы они больше не будут показаны.';

export const MFA_ENROLL_START_PATH = '/auth/staff/mfa/enroll/start';

export const MFA_ENROLL_VERIFY_PATH = '/auth/staff/mfa/enroll/verify';

/** /mfa/setup is canonical voluntary enrollment; never redirect optional LOCAL staff to settings. */
export function shouldRedirectMfaSetupAway(status: StaffMfaStatus): boolean {
  return status.enabled;
}

export function mfaSetupPhase(
  status: StaffMfaStatus | null,
  hasQr: boolean,
  hasRecoveryCodes: boolean,
): 'loading' | 'enabled' | 'recovery' | 'qr' | 'intro' {
  if (!status) return 'loading';
  if (status.enabled && !hasRecoveryCodes) return 'enabled';
  if (hasRecoveryCodes) return 'recovery';
  if (hasQr) return 'qr';
  return 'intro';
}

export function assertTotpUiNotSmsCopy(text: string): boolean {
  const lower = text.toLowerCase();
  return !lower.includes('sms') && !lower.includes('смс') && !lower.includes('телефон');
}
