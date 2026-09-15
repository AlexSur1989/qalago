/// QalaGo spacing scale (logical px). Shared Android/iOS.
///
/// Consumer screens often use [screenPadding] (20) horizontally; legacy
/// [AppSpacing.screen] remains 16 for owner/onboarding paths — adopt
/// incrementally in later UI stages.
abstract final class QalaGoSpacing {
  static const space4 = 4.0;
  static const space8 = 8.0;
  static const space12 = 12.0;
  static const space16 = 16.0;
  static const space20 = 20.0;
  static const space24 = 24.0;
  static const space28 = 28.0;

  /// Typical horizontal inset on consumer home/profile/favorites lists.
  static const screenPadding = space20;

  /// Vertical gap between major sections on scroll screens.
  static const sectionGap = space24;

  /// Gap between items in a section or list.
  static const itemGap = space12;

  /// Legacy alias — same as [space16].
  static const screenPaddingCompact = space16;
}
