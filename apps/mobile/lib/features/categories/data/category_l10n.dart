import '../../../l10n/app_localizations.dart';
import 'category_catalog_sort.dart';

extension CategoryDiscoveryL10n on AppLocalizations {
  String get categorySortRecommended => categoryRecommended;
  String get categorySortNearest => categoryNearest;
  String get categorySortRating => categoryByRating;
  String get categorySortPopular => categoryPopular;
}

String categorySortOptionLabel(AppLocalizations l10n, CategoryCatalogSort sort) {
  return switch (sort) {
    CategoryCatalogSort.recommended => l10n.categoryRecommended,
    CategoryCatalogSort.nearest => l10n.categoryNearest,
    CategoryCatalogSort.rating => l10n.categoryByRating,
    CategoryCatalogSort.popular => l10n.categoryPopular,
  };
}
