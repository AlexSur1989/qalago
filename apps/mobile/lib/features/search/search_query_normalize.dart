/// Normalizes consumer search text for history and matching (aligned with catalog API trim/collapse).
String? normalizeConsumerSearchQuery(String raw) {
  final collapsed = raw.trim().replaceAll(RegExp(r'\s+'), ' ');
  if (collapsed.isEmpty) return null;
  return collapsed;
}

String consumerSearchNeedle(String raw) {
  return raw.toLowerCase();
}

bool shouldPersistConsumerSearchHistory({
  required String trimmedQuery,
  required String? categoryId,
}) {
  if (trimmedQuery.isEmpty) return false;
  if (categoryId != null) return true;
  return trimmedQuery.length >= 2;
}
