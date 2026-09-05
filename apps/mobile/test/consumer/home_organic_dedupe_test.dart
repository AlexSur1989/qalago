import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/ads/data/ad_models.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  test('HOME_FEATURED paid IDs are excluded from organic recommendations', () {
    const paidId = 'biz-paid';
    const organicId = 'biz-organic';

    final ads = [
      AdItemModel(
        campaignId: 'c1',
        placementId: 'p1',
        placementCode: 'HOME_FEATURED',
        position: 1,
        sponsored: true,
        displayLabel: 'Реклама',
        business: {'id': paidId, 'title': 'Paid Cafe'},
      ),
    ];

    final organic = [
      RecommendedBusiness(
        business: BusinessModel(
          id: paidId,
          title: 'Paid Cafe',
          slug: 'paid',
          address: 'A',
        ),
        reason: 'Популярное',
      ),
      RecommendedBusiness(
        business: BusinessModel(
          id: organicId,
          title: 'Organic Cafe',
          slug: 'organic',
          address: 'B',
        ),
        reason: 'Популярное',
      ),
    ];

    final paidIds = collectPaidBusinessIds(ads);
    final filtered =
        organic.where((item) => !paidIds.contains(item.business.id)).toList();

    expect(filtered, hasLength(1));
    expect(filtered.first.business.id, organicId);
  });
}
