import '../../../shared/models/models.dart';
import '../../ads/data/ad_models.dart';

/// Inline CATEGORY_BOOST after this many organic cards (presentation-only).
const categoryBoostInsertAfterOrganic = 4;

class CategoryServeAdsSplit {
  const CategoryServeAdsSplit({
    required this.topItems,
    required this.boostItems,
  });

  final List<AdItemModel> topItems;
  final List<AdItemModel> boostItems;
}

CategoryServeAdsSplit splitCategoryServeAds(
  List<AdItemModel> topItems,
  List<AdItemModel> boostItemsRaw,
) {
  final topIds = collectPaidBusinessIds(topItems);
  final boostOne = boostItemsRaw.take(1).toList();
  final boostItems = boostOne
      .where((item) {
        final id = item.business?['id'] as String?;
        return id == null || !topIds.contains(id);
      })
      .toList();
  return CategoryServeAdsSplit(topItems: topItems, boostItems: boostItems);
}

sealed class CategoryAllPlacesEntry {}

class CategoryAllPlacesOrganic extends CategoryAllPlacesEntry {
  CategoryAllPlacesOrganic(this.business);
  final BusinessModel business;
}

class CategoryAllPlacesBoost extends CategoryAllPlacesEntry {
  CategoryAllPlacesBoost(this.ad);
  final AdItemModel ad;
}

List<CategoryAllPlacesEntry> composeCategoryAllPlacesWithBoost({
  required List<BusinessModel> organicItems,
  required List<AdItemModel> boostItems,
  required List<AdItemModel> topItems,
  int insertAfterOrganic = categoryBoostInsertAfterOrganic,
}) {
  if (organicItems.isEmpty) return const [];
  final boost = boostItems.isNotEmpty ? boostItems.first : null;
  final topIds = collectPaidBusinessIds(topItems);

  final entries = <CategoryAllPlacesEntry>[
    for (final business in organicItems) CategoryAllPlacesOrganic(business),
  ];

  if (boost == null) return entries;

  final boostId = boost.business?['id'] as String?;
  if (boostId != null && topIds.contains(boostId)) return entries;
  if (boostId != null && organicItems.any((b) => b.id == boostId)) {
    return entries;
  }

  final insertIndex = insertAfterOrganic.clamp(0, entries.length);
  entries.insert(insertIndex, CategoryAllPlacesBoost(boost));
  return entries;
}
