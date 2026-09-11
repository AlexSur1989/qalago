import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/category_catalog_sort.dart';

/// Last selected organic sort for category discovery (session-scoped).
final categoryCatalogSortProvider =
    StateProvider<CategoryCatalogSort>((ref) => CategoryCatalogSort.recommended);
