import 'package:flutter/foundation.dart';

/// Canonical [AnalyticsPlatform] string for organic and ad analytics (A.8.6).
///
/// ANDROID / IOS = native clients; WEB = Flutter Web; UNKNOWN = other desktops.
String qalagoAnalyticsPlatform() {
  final override = analyticsPlatformOverrideForTesting;
  if (override != null) return override;

  if (kIsWeb) return 'WEB';
  switch (defaultTargetPlatform) {
    case TargetPlatform.iOS:
      return 'IOS';
    case TargetPlatform.android:
      return 'ANDROID';
    default:
      return 'UNKNOWN';
  }
}

/// Deterministic platform in unit/widget tests (not used in production).
@visibleForTesting
String? analyticsPlatformOverrideForTesting;

@visibleForTesting
void resetAnalyticsPlatformOverrideForTesting() {
  analyticsPlatformOverrideForTesting = null;
}
