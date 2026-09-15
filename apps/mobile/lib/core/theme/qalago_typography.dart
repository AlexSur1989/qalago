import 'package:flutter/material.dart';

import 'qalago_colors.dart';

/// Semantic typography roles — Montserrat via [TextTheme] from [AppTheme.light].
///
/// Weights w600–w900 match current UI; do not reduce globally in foundation stage.
abstract final class QalaGoTypography {
  static TextStyle pageTitle(TextTheme tt) => TextStyle(
        fontSize: 34,
        fontWeight: FontWeight.w900,
        letterSpacing: 0,
        color: QalaGoColors.textPrimary,
        fontFamily: tt.bodyLarge?.fontFamily,
      );

  /// Section headers in lists (theme-aligned).
  static TextStyle sectionTitle(TextTheme tt, ColorScheme cs) =>
      tt.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
            color: cs.onSurface,
          ) ??
      TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: cs.onSurface,
      );

  /// Emphasized marketing-style section titles (Home, ads blocks).
  static TextStyle sectionTitleEmphasis(TextTheme tt) => TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w900,
        color: QalaGoColors.textPrimary,
        fontFamily: tt.bodyLarge?.fontFamily,
      );

  static TextStyle cardTitle(TextTheme tt, ColorScheme cs) =>
      tt.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: cs.onSurface,
          ) ??
      TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: cs.onSurface,
      );

  static TextStyle body(TextTheme tt, ColorScheme cs) =>
      tt.bodyMedium?.copyWith(color: cs.onSurface) ??
      TextStyle(fontSize: 14, color: cs.onSurface);

  static TextStyle bodyStrong(TextTheme tt, ColorScheme cs) =>
      tt.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: cs.onSurface,
          ) ??
      TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: cs.onSurface,
      );

  static TextStyle metadata(TextTheme tt, ColorScheme cs) =>
      tt.bodySmall?.copyWith(
            color: cs.onSurfaceVariant,
            fontWeight: FontWeight.w600,
          ) ??
      TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: cs.onSurfaceVariant,
      );

  static TextStyle caption(TextTheme tt, ColorScheme cs) =>
      tt.bodySmall?.copyWith(color: cs.onSurfaceVariant) ??
      TextStyle(fontSize: 12, color: cs.onSurfaceVariant);

  static TextStyle buttonLabel(TextTheme tt, ColorScheme cs) =>
      tt.labelLarge?.copyWith(fontWeight: FontWeight.w600) ??
      TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: cs.onPrimary,
      );

  static TextStyle navigationLabel(TextTheme tt, {required bool selected}) =>
      tt.labelMedium?.copyWith(
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
          ) ??
      TextStyle(
        fontSize: 12,
        fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
      );

  static TextStyle price(TextTheme tt, ColorScheme cs) =>
      tt.titleLarge?.copyWith(
            fontWeight: FontWeight.w700,
            color: cs.onSurface,
          ) ??
      TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        color: cs.onSurface,
      );

  static TextStyle rating(TextTheme tt) => TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: QalaGoColors.textMuted,
        fontFamily: tt.bodySmall?.fontFamily,
      );
}
