import '../../shared/models/models.dart';

/// Matches catalog-api default page size for list businesses.
const int kSearchResultsPageSize = 20;

List<BusinessModel> mergeSearchResultPages(
  List<BusinessModel> existing,
  List<BusinessModel> nextPage,
) {
  if (nextPage.isEmpty) return existing;
  final seen = existing.map((b) => b.id).toSet();
  final merged = [...existing];
  for (final business in nextPage) {
    if (seen.add(business.id)) {
      merged.add(business);
    }
  }
  return merged;
}

bool searchHasMoreResults({required int loadedCount, required int total}) {
  return loadedCount > 0 && loadedCount < total;
}
