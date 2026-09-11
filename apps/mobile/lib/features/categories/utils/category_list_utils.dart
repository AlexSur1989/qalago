import '../../../shared/models/models.dart';

const categoryRecommendOrganicLimit = 5;

/// Organic «Рекомендуем» rows: recommended-sorted API subset without paid ads.
List<BusinessModel> buildCategoryRecommendedOrganic({
  required List<BusinessModel> recommendedSorted,
  required Set<String> paidBusinessIds,
  int limit = categoryRecommendOrganicLimit,
}) {
  final result = <BusinessModel>[];
  for (final business in recommendedSorted) {
    if (paidBusinessIds.contains(business.id)) continue;
    result.add(business);
    if (result.length >= limit) break;
  }
  return result;
}

/// Skip duplicate card directly under sponsored block (same business id).
List<BusinessModel> categoryAllPlacesAfterSponsored({
  required List<BusinessModel> allPlaces,
  required Iterable<String> sponsoredBusinessIdsInOrder,
}) {
  if (allPlaces.isEmpty) return allPlaces;
  final sponsored = sponsoredBusinessIdsInOrder.toList();
  if (sponsored.isEmpty) return allPlaces;
  final lastSponsoredId = sponsored.last;
  if (allPlaces.first.id != lastSponsoredId) return allPlaces;
  return allPlaces.skip(1).toList();
}
