/// Width breakpoints (logical px) — mobile-first, no device model names.
abstract final class QalaGoBreakpoints {
  /// Narrow phones (layout stress tests).
  static const compactMin = 320.0;

  /// Common phone width reference.
  static const standardMin = 360.0;

  /// Large phone / small tablet — single-column phone UI still applies today.
  static const expandedMin = 600.0;

  static bool isCompactWidth(double width) => width < standardMin;

  static bool isExpandedWidth(double width) => width >= expandedMin;
}
