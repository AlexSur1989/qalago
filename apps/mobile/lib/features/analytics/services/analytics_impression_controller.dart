/// Session-local dedup for organic business/promotion/catalog impressions.
class AnalyticsImpressionController {
  AnalyticsImpressionController();

  final Set<String> _sentKeys = {};

  static String businessKey(String businessId, String surface) =>
      'business:$businessId:$surface';

  static String promotionKey(String promotionId, String surface) =>
      'promotion:$promotionId:$surface';

  static String catalogKey(String catalogItemId, String surface) =>
      'catalog:$catalogItemId:$surface';

  bool hasSent(String key) => _sentKeys.contains(key);

  void markSent(String key) => _sentKeys.add(key);

  void reset() => _sentKeys.clear();
}

/// Organic impression viewability — >=50% visible for 500ms (lighter than ads).
class OrganicViewabilityLogic {
  const OrganicViewabilityLogic({
    this.visibleFractionThreshold = 0.5,
    this.requiredVisibleDurationMs = 500,
  });

  final double visibleFractionThreshold;
  final int requiredVisibleDurationMs;

  bool shouldStartTimer(double visibleFraction) =>
      visibleFraction >= visibleFractionThreshold;

  bool shouldCancelTimer(double visibleFraction) =>
      visibleFraction < visibleFractionThreshold;
}
