import '../../l10n/app_localizations.dart';

/// Canonical backend `sort` values for GET /businesses.
enum SearchCatalogSort {
  recommended('recommended'),
  nearest('nearest'),
  rating('rating'),
  popular('popular');

  const SearchCatalogSort(this.apiValue);

  final String apiValue;

  static SearchCatalogSort fromApi(String? value) {
    if (value == null || value.isEmpty) return SearchCatalogSort.recommended;
    return SearchCatalogSort.values.firstWhere(
      (s) => s.apiValue == value,
      orElse: () => SearchCatalogSort.recommended,
    );
  }

  String localizedLabel(AppLocalizations l10n) => switch (this) {
        SearchCatalogSort.recommended => l10n.searchSortRecommended,
        SearchCatalogSort.nearest => l10n.searchSortNearby,
        SearchCatalogSort.rating => l10n.searchSortRating,
        SearchCatalogSort.popular => l10n.searchSortPopular,
      };
}
