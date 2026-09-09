import 'package:flutter/foundation.dart';

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
  static const devLoginEnabled =
      bool.fromEnvironment('QALAGO_DEV_LOGIN', defaultValue: false);

  /// Development-only mock plan checkout. NEVER enable in production/store builds.
  /// Launch: `flutter run --dart-define=QALAGO_MOCK_PLAN_CHECKOUT=true`
  static const mockPlanCheckoutEnabled =
      bool.fromEnvironment('QALAGO_MOCK_PLAN_CHECKOUT', defaultValue: false);

  static String get _devHost {
    if (devHostOverride.isNotEmpty) return devHostOverride;
    if (kIsWeb) return 'localhost';
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
