import 'package:flutter/foundation.dart';

class AppConstants {
  static const appName = 'QalaGo';
  static const defaultCitySlug = 'uralsk';
  static const selectedCityKey = 'selected_city_slug';
  static const accessTokenKey = 'access_token';

  /// Web: localhost. Desktop/mobile emulator: 127.0.0.1 or 10.0.2.2 (Android).
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3002/api/v1';
    }
    return 'http://127.0.0.1:3002/api/v1';
  }

  static String get mediaBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:3002';
    }
    return 'http://127.0.0.1:3002';
  }

  static String get aiOrchestratorBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:3004/api/v1';
    }
    return 'http://127.0.0.1:3004/api/v1';
  }

  static String resolveMediaUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '$mediaBaseUrl$path';
  }
}
