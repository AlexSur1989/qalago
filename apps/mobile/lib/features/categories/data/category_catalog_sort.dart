/// Organic category list sort (API query values).
enum CategoryCatalogSort {
  recommended('recommended'),
  nearest('nearest'),
  rating('rating'),
  popular('popular');

  const CategoryCatalogSort(this.apiValue);

  final String apiValue;

  static CategoryCatalogSort? tryParse(String? value) {
    if (value == null || value.isEmpty) return null;
    for (final option in CategoryCatalogSort.values) {
      if (option.apiValue == value) return option;
    }
    return null;
  }
}
