import 'package:flutter/material.dart';

/// QalaGo Mobile Design System — semantic colors (light theme, shared Android/iOS).
///
/// **Brand:** [primary] `#00A8D6`, [brandAccentGold] `#FEC50C` (accent only — not
/// a generic UI "secondary" semantic).
///
/// Status and feedback use dedicated semantic colors, not brand gold/blue.
abstract final class QalaGoColors {
  // --- Brand (identity) ---
  static const primary = Color(0xFF00A8D6);
  static const onPrimary = Color(0xFFFFFFFF);
  static const brandAccentGold = Color(0xFFFEC50C);

  // --- Surfaces ---
  static const background = Color(0xFFF5F7FA);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceSubtle = Color(0xFFF7FAFC);
  static const surfaceElevated = surface;

  // --- Text ---
  static const textPrimary = Color(0xFF1A1A1A);
  static const textSecondary = Color(0xFF6B7280);
  static const textMuted = textSecondary;

  // --- Borders ---
  static const border = Color(0xFFE0E4EA);
  static const borderSubtle = Color(0xFFE8EBF0);
  static const divider = Color(0xFFF0F2F5);

  // --- Primary tints (chips, info blocks) ---
  static const primaryTint = Color(0xFFEAF8FC);
  static const primaryTintBorder = Color(0xFFD6ECF3);

  // --- Semantic feedback ---
  static const success = Color(0xFF2E7D32);
  static const onSuccess = Color(0xFFFFFFFF);
  static const warning = Color(0xFFE65100);
  static const onWarning = Color(0xFFFFFFFF);
  static const error = Color(0xFFB3261E);
  static const onError = Color(0xFFFFFFFF);
  static const info = Color(0xFF0277BD);

  // --- Domain-specific (not brand secondary) ---
  static const openStatus = Color(0xFF1B7F4A);
  static const closedStatus = Color(0xFFC0392B);
  static const openStatusBg = Color(0xFFE8F8EE);
  static const closedStatusBg = Color(0xFFFCEFEE);

  /// Star ratings — uses brand gold intentionally.
  static const rating = brandAccentGold;

  /// Active favorite highlight — brand gold, not [primary].
  static const favoriteActive = brandAccentGold;

  /// Sponsored / ad label emphasis — primary brand blue.
  static const sponsoredLabel = primary;
}

/// Legacy name kept for existing imports; values mirror [QalaGoColors] semantics.
abstract final class AppSemanticColors {
  static const success = QalaGoColors.success;
  static const onSuccess = QalaGoColors.onSuccess;
  static const warning = QalaGoColors.warning;
  static const onWarning = QalaGoColors.onWarning;
  static const info = QalaGoColors.info;
}
