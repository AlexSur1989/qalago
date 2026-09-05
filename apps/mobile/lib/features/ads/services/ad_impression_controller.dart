/// Session-local guard against redundant AD_IMPRESSION POSTs.
class AdImpressionController {
  AdImpressionController();

  final Set<String> _sentKeys = {};

  static String key(String campaignId, String placementId) =>
      '$campaignId:$placementId';

  bool hasSent(String campaignId, String placementId) {
    return _sentKeys.contains(key(campaignId, placementId));
  }

  void markSent(String campaignId, String placementId) {
    _sentKeys.add(key(campaignId, placementId));
  }

  void reset() => _sentKeys.clear();
}

/// Viewability timer logic (unit-testable).
class AdViewabilityLogic {
  const AdViewabilityLogic({
    this.visibleFractionThreshold = 0.5,
    this.requiredVisibleDurationMs = 1000,
  });

  final double visibleFractionThreshold;
  final int requiredVisibleDurationMs;

  bool shouldStartTimer(double visibleFraction) =>
      visibleFraction >= visibleFractionThreshold;

  bool shouldCancelTimer(double visibleFraction) =>
      visibleFraction < visibleFractionThreshold;
}
