import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/utils/business_rank.dart';

BusinessModel business({
  required String title,
  String? planTier,
  int? distanceMeters,
}) {
  return BusinessModel(
    id: title,
    title: title,
    slug: title.toLowerCase(),
    address: 'addr',
    planTier: planTier,
    distanceMeters: distanceMeters,
  );
}

void main() {
  group('BusinessModel plan tiers', () {
    test('FREE has no badge', () {
      expect(business(title: 'A', planTier: 'FREE').planBadgeLabel, isNull);
    });

    test('paid tiers do not show consumer plan badges (Stage 6.4)', () {
      expect(business(title: 'A', planTier: 'PREMIUM').planBadgeLabel, isNull);
      expect(business(title: 'A', planTier: 'VIP').planBadgeLabel, isNull);
      expect(business(title: 'A', planTier: 'BASIC').planBadgeLabel, isNull);
    });

    test('unknown tier falls back to FREE', () {
      expect(BusinessModel.normalizePlanTier(null), 'FREE');
      expect(BusinessModel.normalizePlanTier('LEGACY'), 'FREE');
    });

    test('legacy PRO maps to PREMIUM', () {
      expect(BusinessModel.normalizePlanTier('PRO'), 'PREMIUM');
    });
  });

  group('business_rank', () {
    test('does not prioritize subscription tier', () {
      final items = [
        business(title: 'Z', planTier: 'FREE', distanceMeters: 100),
        business(title: 'A', planTier: 'VIP', distanceMeters: 100),
      ];
      final sorted = sortNearbyBusinesses(items);
      expect(sorted.map((b) => b.title).toList(), ['A', 'Z']);
    });

    test('sorts by distance before title', () {
      final items = [
        business(title: 'Far', planTier: 'VIP', distanceMeters: 500),
        business(title: 'Near', planTier: 'FREE', distanceMeters: 50),
      ];
      final sorted = sortNearbyBusinesses(items);
      expect(sorted.first.title, 'Near');
    });
  });
}
