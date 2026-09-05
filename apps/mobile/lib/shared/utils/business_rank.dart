import '../../shared/models/models.dart';

/// Радиус geo-поиска «рядом с вами» (км).
const nearbyRadiusKm = 3.0;

/// Subscription tier does not affect organic ranking (Stage 4C).
int businessPlanTierRank(String? planTier) => 0;

bool isTopBusiness(BusinessModel business) => false;

bool isProBusiness(BusinessModel business) => false;

bool isPriorityBusiness(BusinessModel business) => false;

/// Distance first, then title. Plan tier is ignored.
int compareNearbyBusinesses(BusinessModel a, BusinessModel b) {
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
  return (top: const [], pro: const [], regular: sorted);
}

({List<BusinessModel> priority, List<BusinessModel> regular}) splitNearbyBusinesses(
  List<BusinessModel> items,
) {
  final sorted = sortNearbyBusinesses(items);
  return (priority: const [], regular: sorted);
}
