import 'qalago_spacing.dart';

/// Legacy spacing aliases — prefer [QalaGoSpacing] for new code.
class AppSpacing {
  /// Owner/onboarding/list screens (16px). Consumer often uses [QalaGoSpacing.screenPadding] (20).
  static const screen = QalaGoSpacing.screenPaddingCompact;

  static const section = QalaGoSpacing.space20;
  static const item = QalaGoSpacing.itemGap;
}
