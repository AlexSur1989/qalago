/// Local gallery scope + display item resolution (A.7.7.5 hotfix 1).
library;

/// Stable identity for photos list cache and widget state isolation.
String businessPhotosScopeKey({
  required String businessId,
  String? locationId,
}) {
  return '$businessId|${locationId ?? ''}';
}

/// Page 1 must always render provider rows; accumulated local rows are page 2+ only.
List<Map<String, dynamic>> resolveBusinessPhotosDisplayItems({
  required int page,
  required List<Map<String, dynamic>> providerPageItems,
  required List<Map<String, dynamic>> accumulatedItems,
}) {
  if (page == 1) {
    return providerPageItems;
  }
  return accumulatedItems;
}
