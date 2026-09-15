import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'qalago_colors.dart';
import 'qalago_elevation.dart';
import 'qalago_icon_sizes.dart';
import 'qalago_radius.dart';
import 'qalago_touch_targets.dart';

export 'qalago_colors.dart' show AppSemanticColors, QalaGoColors;

/// Application [ThemeData] built on [QalaGoColors] foundations (light theme only).
class AppTheme {
  /// Brand primary `#00A8D6` — alias of [QalaGoColors.primary].
  static const Color kzBlue = QalaGoColors.primary;

  /// Brand accent gold — not a generic semantic secondary.
  static const Color kzGold = QalaGoColors.brandAccentGold;

  static const Color background = QalaGoColors.background;
  static const Color textDark = QalaGoColors.textPrimary;
  static const Color textMuted = QalaGoColors.textMuted;
  static const Color outlineLight = QalaGoColors.border;
  static const Color surfaceSubtle = QalaGoColors.surfaceSubtle;
  static const Color borderSubtle = QalaGoColors.borderSubtle;
  static const Color primaryTint = QalaGoColors.primaryTint;
  static const Color primaryTintBorder = QalaGoColors.primaryTintBorder;
  static const Color openStatus = QalaGoColors.openStatus;
  static const Color closedStatus = QalaGoColors.closedStatus;
  static const Color openStatusBg = QalaGoColors.openStatusBg;
  static const Color closedStatusBg = QalaGoColors.closedStatusBg;
  static const Color error = QalaGoColors.error;

  static const double cardRadius = QalaGoRadius.card;
  static const double buttonRadius = QalaGoRadius.button;
  static const double inputRadius = QalaGoRadius.input;
  static const double chipRadius = QalaGoRadius.chip;

  static ColorScheme get _colorScheme => const ColorScheme(
        brightness: Brightness.light,
        primary: QalaGoColors.primary,
        onPrimary: QalaGoColors.onPrimary,
        secondary: QalaGoColors.brandAccentGold,
        onSecondary: QalaGoColors.textPrimary,
        surface: QalaGoColors.surface,
        onSurface: QalaGoColors.textPrimary,
        onSurfaceVariant: QalaGoColors.textSecondary,
        surfaceContainerHighest: QalaGoColors.background,
        outline: QalaGoColors.border,
        outlineVariant: QalaGoColors.divider,
        error: QalaGoColors.error,
        onError: QalaGoColors.onError,
      );

  static ThemeData get light {
    final scheme = _colorScheme;
    final baseTheme = ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      scaffoldBackgroundColor: background,
    );

    final textTheme = GoogleFonts.montserratTextTheme(baseTheme.textTheme).apply(
      bodyColor: textDark,
      displayColor: textDark,
    );

    final buttonShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(buttonRadius),
    );

    return baseTheme.copyWith(
      textTheme: textTheme,
      iconTheme: const IconThemeData(
        color: QalaGoColors.textSecondary,
        size: QalaGoIconSizes.standard,
      ),
      dividerTheme: const DividerThemeData(
        color: QalaGoColors.divider,
        thickness: 1,
        space: 1,
      ),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        elevation: QalaGoElevation.flat,
        scrolledUnderElevation: QalaGoElevation.flat,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          color: scheme.onSurface,
        ),
        iconTheme: IconThemeData(color: scheme.onSurface),
        actionsIconTheme: IconThemeData(color: scheme.primary),
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: QalaGoElevation.card,
        shadowColor: QalaGoElevation.cardShadowColor(scheme.onSurface),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(cardRadius)),
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(inputRadius),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(inputRadius),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(inputRadius),
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(inputRadius),
          borderSide: BorderSide(color: scheme.error, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(inputRadius),
          borderSide: BorderSide(color: scheme.error, width: 2),
        ),
        filled: true,
        fillColor: scheme.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        labelStyle: textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant),
        hintStyle: textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant),
        errorStyle: textTheme.bodySmall?.copyWith(color: scheme.error),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: scheme.primary,
          foregroundColor: scheme.onPrimary,
          disabledBackgroundColor: scheme.primary.withValues(alpha: 0.38),
          disabledForegroundColor: scheme.onPrimary.withValues(alpha: 0.62),
          minimumSize: const Size(64, QalaGoTouchTargets.minInteractive),
          shape: buttonShape,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            color: scheme.onPrimary,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: scheme.primary,
          disabledForegroundColor: scheme.onSurfaceVariant.withValues(alpha: 0.5),
          minimumSize: const Size(64, QalaGoTouchTargets.minInteractive),
          shape: buttonShape,
          side: BorderSide(color: scheme.outline),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: scheme.primary,
          disabledForegroundColor: scheme.onSurfaceVariant.withValues(alpha: 0.5),
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: scheme.surface,
        selectedColor: scheme.primaryContainer,
        disabledColor: scheme.surfaceContainerHighest,
        labelStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w500),
        secondaryLabelStyle: textTheme.labelMedium,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(chipRadius),
          side: BorderSide(color: scheme.outlineVariant),
        ),
        checkmarkColor: scheme.onPrimaryContainer,
        side: BorderSide(color: scheme.outlineVariant),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: scheme.surface,
        elevation: QalaGoElevation.dialog,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(cardRadius)),
        titleTextStyle: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        contentTextStyle: textTheme.bodyMedium,
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: scheme.surface,
        modalBackgroundColor: scheme.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(cardRadius)),
        ),
        showDragHandle: true,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(QalaGoRadius.medium)),
        backgroundColor: textDark,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: Colors.white),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: scheme.primary),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: scheme.secondary,
        foregroundColor: scheme.onSecondary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(QalaGoRadius.large)),
      ),
    );
  }
}
