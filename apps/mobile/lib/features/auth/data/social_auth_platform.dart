import 'package:flutter/foundation.dart';

/// Whether Google social login UI should be offered on this runtime.
bool isGoogleSignInPlatformSupported() {
  if (kIsWeb) return false;
  return defaultTargetPlatform == TargetPlatform.android ||
      defaultTargetPlatform == TargetPlatform.iOS;
}

/// Apple Sign-In MVP: native iOS only (no broken Android/web button).
bool isAppleSignInPlatformSupported() {
  if (kIsWeb) return false;
  return defaultTargetPlatform == TargetPlatform.iOS;
}
