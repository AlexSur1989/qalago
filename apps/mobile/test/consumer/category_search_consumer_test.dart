import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/ads/data/ad_models.dart';
import 'package:qalago_mobile/features/categories/presentation/category_businesses_screen.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/utils/business_rank.dart';

void main() {
  group('category paid / organic dedupe', () {
    test('CATEGORY_TOP and CATEGORY_BOOST IDs excluded from organic list', () {
      const paidTop = 'biz-top';
      const paidBoost = 'biz-boost';
      const organicId = 'biz-organic';

      final ads = [
        AdItemModel(
          campaignId: 'c1',
          placementId: 'p1',
          placementCode: 'CATEGORY_TOP',
          position: 1,
          sponsored: true,
          displayLabel: 'Реклама',
          business: {'id': paidTop, 'title': 'Top Cafe'},
        ),
        AdItemModel(
          campaignId: 'c2',
          placementId: 'p2',
          placementCode: 'CATEGORY_BOOST',
          position: 1,
          sponsored: true,
          displayLabel: 'Реклама',
          business: {'id': paidBoost, 'title': 'Boost Cafe'},
        ),
      ];

      final allItems = [
        BusinessModel(id: paidTop, title: 'Top Cafe', slug: 'top', address: 'A'),
        BusinessModel(id: paidBoost, title: 'Boost Cafe', slug: 'boost', address: 'B'),
        BusinessModel(id: organicId, title: 'Organic Cafe', slug: 'organic', address: 'C'),
      ];

      final paidIds = collectPaidBusinessIds(ads);
      final recommendedOnly = allItems.where((b) => !paidIds.contains(b.id)).toList();
      final allPlaces = allItems;

      expect(paidIds, {paidTop, paidBoost});
      expect(recommendedOnly, hasLength(1));
      expect(recommendedOnly.first.id, organicId);
      expect(allPlaces, hasLength(3));
    });

    test('sponsored ads carry display labels', () {
      const ad = AdItemModel(
        campaignId: 'c1',
        placementId: 'p1',
        placementCode: 'CATEGORY_TOP',
        position: 1,
        sponsored: true,
        displayLabel: 'Реклама',
        business: {'id': 'b1', 'title': 'Paid'},
      );
      expect(ad.sponsored, isTrue);
      expect(ad.displayLabel, 'Реклама');
    });
  });

  group('category organic ranking', () {
    test('VIP plan tier does not rank above closer organic business', () {
      final vip = BusinessModel(
        id: 'vip',
        title: 'AAA VIP',
        slug: 'vip',
        address: 'A',
        planTier: 'VIP',
        distanceMeters: 500,
      );
      final basic = BusinessModel(
        id: 'basic',
        title: 'ZZZ Basic',
        slug: 'basic',
        address: 'B',
        planTier: 'BASIC',
        distanceMeters: 100,
      );

      expect(businessPlanTierRank('VIP'), 0);
      expect(businessPlanTierRank('BASIC'), 0);

      final sorted = sortNearbyBusinesses([vip, basic]);
      expect(sorted.first.id, basic.id);
    });

    test('organic sort falls back to title when distance equal', () {
      final a = BusinessModel(
        id: 'a',
        title: 'Alpha',
        slug: 'a',
        address: 'A',
        distanceMeters: 200,
      );
      final b = BusinessModel(
        id: 'b',
        title: 'Beta',
        slug: 'b',
        address: 'B',
        distanceMeters: 200,
      );

      final sorted = sortNearbyBusinesses([b, a]);
      expect(sorted.first.title, 'Alpha');
    });
  });

  group('category navigation helpers', () {
    test('categoryDisplayTitle uses category title', () {
      final category = CategoryModel(
        id: 'cat1',
        title: 'Кофейни',
        slug: 'coffee',
      );
      expect(categoryDisplayTitle(category), 'Кофейни');
    });
  });
}
