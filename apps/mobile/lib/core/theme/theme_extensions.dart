import 'package:flutter/material.dart';

import 'app_theme.dart';
import 'qalago_colors.dart';
import 'qalago_elevation.dart';
import 'qalago_typography.dart';

/// BuildContext helpers — canonical access path for typography and colors.
extension QalagoTheme on BuildContext {
  ColorScheme get cs => Theme.of(this).colorScheme;
  TextTheme get tt => Theme.of(this).textTheme;

  TextStyle get pageTitleStyle => QalaGoTypography.pageTitle(tt);

  TextStyle get sectionTitleStyle => QalaGoTypography.sectionTitle(tt, cs);

  TextStyle get sectionTitleEmphasisStyle => QalaGoTypography.sectionTitleEmphasis(tt);

  TextStyle get cardTitleStyle => QalaGoTypography.cardTitle(tt, cs);

  TextStyle get bodyStyle => QalaGoTypography.body(tt, cs);

  TextStyle get bodyStrongStyle => QalaGoTypography.bodyStrong(tt, cs);

  TextStyle get bodySecondaryStyle => QalaGoTypography.body(tt, cs).copyWith(
        color: cs.onSurfaceVariant,
      );

  TextStyle get metadataStyle => QalaGoTypography.metadata(tt, cs);

  TextStyle get captionStyle => QalaGoTypography.caption(tt, cs);

  TextStyle get metricValueStyle => QalaGoTypography.price(tt, cs).copyWith(
        fontWeight: FontWeight.bold,
      );

  TextStyle get pricePrimaryStyle => QalaGoTypography.price(tt, cs);

  TextStyle get buttonLabelStyle => QalaGoTypography.buttonLabel(tt, cs);

  TextStyle navigationLabelStyle({required bool selected}) =>
      QalaGoTypography.navigationLabel(tt, selected: selected);

  TextStyle get navLabelStyle => QalaGoTypography.navigationLabel(tt, selected: false);

  TextStyle get ratingTextStyle => QalaGoTypography.rating(tt);

  Color get navUnselectedColor => cs.onSurfaceVariant;

  Color get navSelectedColor => cs.primary;

  Color get successColor => QalaGoColors.success;

  Color get warningColor => QalaGoColors.warning;

  Color get infoColor => QalaGoColors.info;

  Color get favoriteActiveColor => QalaGoColors.favoriteActive;

  Color get ratingColor => QalaGoColors.rating;

  Color primarySurfaceTint([double alpha = 0.12]) =>
      cs.primary.withValues(alpha: alpha);

  Color get softBorderColor => cs.outline.withValues(alpha: 0.55);

  Color get cardShadowColor => QalaGoElevation.cardShadowColor(cs.onSurface);

  /// Unified in-app search field decoration (home tap-through, categories, search, promotions).
  InputDecoration qalagoSearchDecoration({
    required String hintText,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      prefixIcon: Icon(Icons.search, color: cs.onSurfaceVariant),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: cs.surface,
      contentPadding: const EdgeInsets.symmetric(vertical: 16),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppTheme.inputRadius),
        borderSide: BorderSide(color: softBorderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppTheme.inputRadius),
        borderSide: BorderSide(color: cs.primary, width: 2),
      ),
    );
  }
}
