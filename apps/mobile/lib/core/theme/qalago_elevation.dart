import 'package:flutter/material.dart';

/// Elevation and shadow recipes — light theme, shared platforms.
abstract final class QalaGoElevation {
  static const flat = 0.0;
  static const card = 2.0;
  static const dialog = 8.0;

  static Color cardShadowColor(Color onSurface) =>
      onSurface.withValues(alpha: 0.05);

  /// Bottom navigation bar shadow (matches current [AppShell] recipe).
  static List<BoxShadow> navigationBarShadow(Color onSurface) => [
        BoxShadow(
          color: onSurface.withValues(alpha: 0.06),
          blurRadius: 18,
          offset: const Offset(0, -6),
        ),
      ];
}
