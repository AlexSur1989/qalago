import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/ads/data/ad_models.dart';
import 'package:qalago_mobile/features/categories/utils/category_feed_compose.dart';
import 'package:qalago_mobile/shared/models/models.dart';

AdItemModel _ad(String code, String businessId) {
  return AdItemModel(
    campaignId: 'c-$businessId',
    placementId: 'p1',
    placementCode: code,
    position: 1,
    sponsored: true,
    displayLabel: 'Реклама',
    business: {'id': businessId, 'title': businessId, 'slug': businessId},
  );
}

BusinessModel _biz(String id) => BusinessModel(
      id: id,
      title: id,
      slug: id,
      address: 'A',
    );

void main() {
  group('category_feed_compose (6.13M.6)', () {
    test('split suppresses BOOST duplicate of TOP business', () {
      final split = splitCategoryServeAds(
        [_ad('CATEGORY_TOP', 'same')],
        [_ad('CATEGORY_BOOST', 'same')],
      );
      expect(split.topItems, hasLength(1));
      expect(split.boostItems, isEmpty);
    });

    test('compose keeps organic count and inserts BOOST inline', () {
      final organic = List.generate(5, (i) => _biz('o$i'));
      final entries = composeCategoryAllPlacesWithBoost(
        organicItems: organic,
        boostItems: [_ad('CATEGORY_BOOST', 'boost')],
        topItems: const [],
      );
      expect(entries.whereType<CategoryAllPlacesOrganic>(), hasLength(5));
      expect(entries.whereType<CategoryAllPlacesBoost>(), hasLength(1));
      expect(entries[categoryBoostInsertAfterOrganic], isA<CategoryAllPlacesBoost>());
    });

    test('compose skips BOOST when business on organic page', () {
      final organic = [_biz('o1'), _biz('boost')];
      final entries = composeCategoryAllPlacesWithBoost(
        organicItems: organic,
        boostItems: [_ad('CATEGORY_BOOST', 'boost')],
        topItems: const [],
      );
      expect(entries.whereType<CategoryAllPlacesBoost>(), isEmpty);
    });
  });
}
