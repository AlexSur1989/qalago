/// Canonical interaction branch for analytics (A.8.5).
///
/// Uses server-resolved [activeLocationId] from business detail payload when
/// present. Does not fall back to raw route [selectedLocationId] alone — stale
/// query params must not be attributed when the API normalized branch state.
String? effectiveAnalyticsBranchId({
  required Map<String, dynamic> detailData,
}) {
  final active = detailData['activeLocationId'];
  if (active is String && active.trim().isNotEmpty) {
    return active.trim();
  }
  return null;
}

/// Discovery/map card branch context when backend supplied [contextLocationId].
String? analyticsBranchFromBusinessContext(String? contextLocationId) {
  if (contextLocationId == null || contextLocationId.trim().isEmpty) {
    return null;
  }
  return contextLocationId.trim();
}
