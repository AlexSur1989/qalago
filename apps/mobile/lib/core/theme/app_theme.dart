import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Semantic colors outside [ColorScheme.error] — use for status, not primary CTAs.
class AppSemanticColors {
  static const success = Color(0xFF2E7D32);
  static const onSuccess = Color(0xFFFFFFFF);
  static const warning = Color(0xFFE65100);
  static const onWarning = Color(0xFFFFFFFF);
  static const info = Color(0xFF0277BD);
}

class AppTheme {
  // Brand tokens (KZ flag accents)
  static const Color kzBlue = Color(0xFF00A8D6);
  static const Color kzGold = Color(0xFFFEC50C);
  static const Color background = Color(0xFFF5F7FA);
  static const Color textDark = Color(0xFF1A1A1A);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color outlineLight = Color(0xFFE0E4EA);

  static const double cardRadius = 20;
  static const double buttonRadius = 16;
  static const double inputRadius = 16;
  static const double chipRadius = 12;

  static ColorScheme get _colorScheme => const ColorScheme(
        brightness: Brightness.light,
        primary: kzBlue,
        onPrimary: Colors.white,
        secondary: kzGold,
        onSecondary: textDark,
        surface: Colors.white,
        onSurface: textDark,
        onSurfaceVariant: textMuted,
        surfaceContainerHighest: background,
        outline: outlineLight,
        outlineVariant: Color(0xFFF0F2F5),
        error: Color(0xFFB3261E),
        onError: Colors.white,
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
      iconTheme: IconThemeData(color: scheme.onSurfaceVariant, size: 24),
      dividerTheme: DividerThemeData(
        color: scheme.outlineVariant,
        thickness: 1,
        space: 1,
      ),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          color: scheme.onSurface,
        ),
        iconTheme: IconThemeData(color: scheme.onSurface),
        actionsIconTheme: IconThemeData(color: scheme.primary),
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.05),
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
          minimumSize: const Size(64, 48),
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
          minimumSize: const Size(64, 48),
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
        elevation: 8,
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: textDark,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: Colors.white),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: scheme.primary),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: scheme.secondary,
        foregroundColor: scheme.onSecondary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
