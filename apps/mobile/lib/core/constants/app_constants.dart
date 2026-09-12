import 'package:flutter/foundation.dart';

import '../release/release_environment.dart';

class AppConstants {
  static const appName = 'QalaGo';
  static const defaultCitySlug = 'uralsk';
  static const selectedCityKey = 'selected_city_slug';
  static const accessTokenKey = 'access_token';

  /// Override via `--dart-define=QALAGO_API_BASE_URL=https://api.qalago.kz/api/v1`
  static const apiBaseUrlOverride = String.fromEnvironment('QALAGO_API_BASE_URL');

  /// Override via `--dart-define=QALAGO_AI_BASE_URL=https://ai.qalago.kz/api/v1`
  static const aiBaseUrlOverride = String.fromEnvironment('QALAGO_AI_BASE_URL');

  /// Override host for catalog/media on Android emulator: `--dart-define=QALAGO_DEV_HOST=10.0.2.2`
  static const devHostOverride = String.fromEnvironment('QALAGO_DEV_HOST');

  /// Development-only passwordless login. NEVER enable in production builds.
  /// Launch: `flutter run --dart-define=QALAGO_DEV_LOGIN=true`
  static const _devLoginFlag =
      bool.fromEnvironment('QALAGO_DEV_LOGIN', defaultValue: false);

  /// DEV login: debug builds only, never in release/profile.
  static bool get devLoginEnabled =>
      ReleaseEnvironment.allowDevLogin && _devLoginFlag;

  /// Development-only mock plan checkout. NEVER enable in production/store builds.
  /// Launch: `flutter run --dart-define=QALAGO_MOCK_PLAN_CHECKOUT=true`
  static const _mockPlanCheckoutFlag =
      bool.fromEnvironment('QALAGO_MOCK_PLAN_CHECKOUT', defaultValue: false);

  static bool get mockPlanCheckoutEnabled =>
      ReleaseEnvironment.allowMockPlanCheckout && _mockPlanCheckoutFlag;

  /// Client-side Google Sign-In (requires matching backend GOOGLE_AUTH_ENABLED).
  static const googleAuthEnabled =
      bool.fromEnvironment('QALAGO_GOOGLE_AUTH_ENABLED', defaultValue: false);

  /// Client-side Sign in with Apple (requires matching backend APPLE_AUTH_ENABLED).
  static const appleAuthEnabled =
      bool.fromEnvironment('QALAGO_APPLE_AUTH_ENABLED', defaultValue: false);

  /// Phone OTP fallback on login screen. Backend uses OTP_AUTH_ENABLED separately.
  static const otpAuthEnabled =
      bool.fromEnvironment('QALAGO_OTP_AUTH_ENABLED', defaultValue: true);

  /// Optional Google OAuth client ID (platform-specific, from Google Cloud Console).
  static const googleClientId = String.fromEnvironment('QALAGO_GOOGLE_CLIENT_ID');

  /// Optional server/web client ID — required on some platforms for ID tokens.
  static const googleServerClientId =
      String.fromEnvironment('QALAGO_GOOGLE_SERVER_CLIENT_ID');

  static String get _devHost {
    if (devHostOverride.isNotEmpty) return devHostOverride;
    if (kIsWeb) {
      // Align API host with the page host (localhost vs 127.0.0.1) for local dev.
      final pageHost = Uri.base.host;
      if (pageHost == 'localhost' || pageHost == '127.0.0.1') {
        return pageHost;
      }
      if (pageHost == '[::1]') return 'localhost';
      return 'localhost';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      // Android emulator loopback. Physical device MUST set QALAGO_DEV_HOST=LAN_IP.
      return '10.0.2.2';
    }
    return '127.0.0.1';
  }

  static String get baseUrl {
    if (apiBaseUrlOverride.isNotEmpty) return apiBaseUrlOverride;
    return 'http://$_devHost:3002/api/v1';
  }

  static String get mediaBaseUrl {
    if (apiBaseUrlOverride.isNotEmpty) {
      final uri = Uri.parse(apiBaseUrlOverride);
      return '${uri.scheme}://${uri.host}${uri.hasPort ? ':${uri.port}' : ''}';
    }
    return 'http://$_devHost:3002';
  }

  static String get aiOrchestratorBaseUrl {
    if (aiBaseUrlOverride.isNotEmpty) return aiBaseUrlOverride;
    return 'http://$_devHost:3004/api/v1';
  }

  static String resolveMediaUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '$mediaBaseUrl$path';
  }
}
