import 'package:flutter/material.dart';

import 'app_theme.dart';

/// BuildContext helpers for consistent typography and colors.
extension QalagoTheme on BuildContext {
  ColorScheme get cs => Theme.of(this).colorScheme;
  TextTheme get tt => Theme.of(this).textTheme;

  TextStyle? get sectionTitleStyle =>
      tt.titleMedium?.copyWith(fontWeight: FontWeight.w700, color: cs.onSurface);

  TextStyle? get cardTitleStyle =>
      tt.titleSmall?.copyWith(fontWeight: FontWeight.w600, color: cs.onSurface);

  TextStyle? get bodySecondaryStyle =>
      tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant);

  TextStyle? get captionStyle =>
      tt.bodySmall?.copyWith(color: cs.onSurfaceVariant);

  TextStyle? get metricValueStyle =>
      tt.headlineSmall?.copyWith(fontWeight: FontWeight.bold, color: cs.onSurface);

  TextStyle? get pricePrimaryStyle =>
      tt.titleLarge?.copyWith(fontWeight: FontWeight.w700, color: cs.onSurface);

  TextStyle? get navLabelStyle => tt.labelMedium;

  Color get navUnselectedColor => cs.onSurfaceVariant;

  Color get navSelectedColor => cs.primary;

  Color get successColor => AppSemanticColors.success;

  Color get warningColor => AppSemanticColors.warning;

  Color get infoColor => AppSemanticColors.info;

  Color primarySurfaceTint([double alpha = 0.12]) =>
      cs.primary.withValues(alpha: alpha);
}
