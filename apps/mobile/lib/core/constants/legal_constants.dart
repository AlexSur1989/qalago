/// Public legal URLs (Stage 6.3). Override in production builds:
/// `--dart-define=QALAGO_PUBLIC_BASE_URL=https://qalago.kz`
class LegalConstants {
  static const publicBaseUrlOverride = String.fromEnvironment(
    'QALAGO_PUBLIC_BASE_URL',
  );

  static const defaultPublicBaseUrl = 'https://qalago.kz';

  static String get publicBaseUrl {
    if (publicBaseUrlOverride.isNotEmpty) return publicBaseUrlOverride;
    return defaultPublicBaseUrl;
  }

  static String get privacyUrl => '$publicBaseUrl/privacy';
  static String get termsUrl => '$publicBaseUrl/terms';
  static String get accountDeletionUrl => '$publicBaseUrl/account-deletion';
}
