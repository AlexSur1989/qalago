import 'search_catalog_sort.dart';
import 'search_filters.dart';

int searchActiveFilterCount({
  required String? categoryId,
  required String? subcategoryId,
  required SearchRadiusMode radiusMode,
}) {
  var count = 0;
  if (categoryId != null && categoryId.isNotEmpty) count++;
  if (subcategoryId != null && subcategoryId.isNotEmpty) count++;
  if (radiusMode != SearchRadiusMode.wholeCity) count++;
  return count;
}

bool searchHasNonDefaultSort(SearchCatalogSort sort) =>
    sort != SearchCatalogSort.recommended;
