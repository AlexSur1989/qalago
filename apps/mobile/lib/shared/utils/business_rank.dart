import '../../shared/models/models.dart';

/// Радиус geo-поиска «рядом с вами» (км).
const nearbyRadiusKm = 3.0;

int businessPlanTierRank(String? planTier) {
  switch (planTier) {
    case 'TOP_CITY':
      return 2;
    case 'PRO':
      return 1;
    default:
      return 0;
  }
}

bool isTopBusiness(BusinessModel business) => business.planTier == 'TOP_CITY';

bool isProBusiness(BusinessModel business) => business.planTier == 'PRO';

bool isPriorityBusiness(BusinessModel business) =>
    businessPlanTierRank(business.planTier) > 0;

/// TOP → PRO → BASIC, then featuredSlot, then distance.
int compareNearbyBusinesses(BusinessModel a, BusinessModel b) {
  final tierDiff =
      businessPlanTierRank(b.planTier) - businessPlanTierRank(a.planTier);
  if (tierDiff != 0) return tierDiff;

  final slotA = a.featuredSlot ?? 999;
  final slotB = b.featuredSlot ?? 999;
  if (slotA != slotB) return slotA - slotB;

  if (a.isFeatured != b.isFeatured) {
    return a.isFeatured ? -1 : 1;
  }

  final distA = a.distanceMeters ?? 999999999;
  final distB = b.distanceMeters ?? 999999999;
  if (distA != distB) return distA - distB;

  return a.title.compareTo(b.title);
}

List<BusinessModel> sortNearbyBusinesses(List<BusinessModel> items) {
  return [...items]..sort(compareNearbyBusinesses);
}

({List<BusinessModel> top, List<BusinessModel> pro, List<BusinessModel> regular})
    splitBusinessesByTier(List<BusinessModel> items) {
  final sorted = sortNearbyBusinesses(items);
  return (
    top: sorted.where(isTopBusiness).toList(),
    pro: sorted.where(isProBusiness).toList(),
    regular: sorted
        .where((b) => !isTopBusiness(b) && !isProBusiness(b))
        .toList(),
  );
}

({List<BusinessModel> priority, List<BusinessModel> regular}) splitNearbyBusinesses(
  List<BusinessModel> items,
) {
  final sorted = sortNearbyBusinesses(items);
  final priority = sorted.where(isPriorityBusiness).toList();
  final regular = sorted.where((b) => !isPriorityBusiness(b)).toList();
  return (priority: priority, regular: regular);
}
