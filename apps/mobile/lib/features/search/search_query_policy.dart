import 'search_filters.dart';

/// Minimum free-text length before catalog search API (without category / radius).
const int kConsumerSearchMinQueryLength = 2;

enum SearchResultsPaneMode {
  initial,
  continueTyping,
  active,
}

SearchResultsPaneMode resolveSearchResultsPaneMode({
  required String trimmedQuery,
  required String? categoryId,
  required SearchRadiusMode radiusMode,
}) {
  if (categoryId != null ||
      radiusMode != SearchRadiusMode.wholeCity ||
      trimmedQuery.length >= kConsumerSearchMinQueryLength) {
    return SearchResultsPaneMode.active;
  }
  if (trimmedQuery.length == 1) {
    return SearchResultsPaneMode.continueTyping;
  }
  return SearchResultsPaneMode.initial;
}

bool searchShouldFetchBusinesses({
  required String trimmedQuery,
  required String? categoryId,
  required SearchRadiusMode radiusMode,
}) {
  return resolveSearchResultsPaneMode(
        trimmedQuery: trimmedQuery,
        categoryId: categoryId,
        radiusMode: radiusMode,
      ) ==
      SearchResultsPaneMode.active;
}

/// Search string sent to API for the current UI query.
String? searchApiTextParam({
  required String trimmedQuery,
  required String? categoryId,
}) {
  if (trimmedQuery.isEmpty) return null;
  if (categoryId != null) return trimmedQuery;
  if (trimmedQuery.length >= kConsumerSearchMinQueryLength) {
    return trimmedQuery;
  }
  return null;
}
