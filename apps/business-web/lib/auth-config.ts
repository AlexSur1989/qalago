export const businessWebDevLoginEnabled =
  process.env.NEXT_PUBLIC_QALAGO_DEV_LOGIN === 'true';

/** Development-only mock subscription checkout. Must stay false in production builds. */
export const businessWebMockPlanCheckoutEnabled =
  process.env.NEXT_PUBLIC_QALAGO_MOCK_PLAN_CHECKOUT === 'true';

/** Client-side Google Sign-In (requires backend GOOGLE_AUTH_ENABLED + GOOGLE_CLIENT_ID_WEB). */
export const businessWebGoogleAuthEnabled =
  process.env.NEXT_PUBLIC_QALAGO_GOOGLE_AUTH_ENABLED === 'true';

/** Google OAuth Web client ID from Google Cloud Console. */
export const businessWebGoogleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

/** True when Google button may be shown and GIS may initialize. */
export const businessWebGoogleAuthConfigured =
  businessWebGoogleAuthEnabled && businessWebGoogleClientId.length > 0;

/** Client-side Sign in with Apple (requires backend APPLE_AUTH_ENABLED + APPLE_CLIENT_ID_WEB). */
export const businessWebAppleAuthEnabled =
  process.env.NEXT_PUBLIC_QALAGO_APPLE_AUTH_ENABLED === 'true';

/** Apple Service ID (web client id). */
export const businessWebAppleClientId =
  process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? '';

/** Apple redirect URI registered in Apple Developer (must match exactly). */
export const businessWebAppleRedirectUri =
  process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ?? '';

/** True when Apple button may be shown. */
export const businessWebAppleAuthConfigured =
  businessWebAppleAuthEnabled &&
  businessWebAppleClientId.length > 0 &&
  businessWebAppleRedirectUri.length > 0;

export const businessWebSocialAuthConfigured =
  businessWebGoogleAuthConfigured || businessWebAppleAuthConfigured;

/** Phone OTP fallback (requires backend OTP_AUTH_ENABLED). Default true when unset. */
export const businessWebOtpAuthEnabled =
  process.env.NEXT_PUBLIC_QALAGO_OTP_AUTH_ENABLED !== 'false';

export const businessWebOtpAuthConfigured = businessWebOtpAuthEnabled;

/** At least one login method may be shown (social, OTP, or dev login). */
export const businessWebAnyLoginMethodConfigured =
  businessWebSocialAuthConfigured ||
  businessWebOtpAuthConfigured ||
  businessWebDevLoginEnabled;
