import 'package:flutter/foundation.dart';

enum QalagoReleaseEnvironment {
  local,
  staging,
  production,
}

class ReleaseEnvironment {
  ReleaseEnvironment._();

  static const _envRaw = String.fromEnvironment('QALAGO_ENV', defaultValue: 'LOCAL');

  static QalagoReleaseEnvironment get current {
    switch (_envRaw.toUpperCase()) {
      case 'STAGING':
        return QalagoReleaseEnvironment.staging;
      case 'PRODUCTION':
        return QalagoReleaseEnvironment.production;
      default:
        return QalagoReleaseEnvironment.local;
    }
  }

  /// DEV login and mock checkout are never allowed in release builds.
  static bool get allowDevLogin =>
      !kReleaseMode && const bool.fromEnvironment('QALAGO_DEV_LOGIN', defaultValue: false);

  static bool get allowMockPlanCheckout =>
      !kReleaseMode &&
      const bool.fromEnvironment('QALAGO_MOCK_PLAN_CHECKOUT', defaultValue: false);
}
