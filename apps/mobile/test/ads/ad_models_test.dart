import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/ads/providers/ad_serve_provider.dart';
import 'package:qalago_mobile/features/ads/data/ad_models.dart';
import 'package:qalago_mobile/features/ads/providers/ad_session_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  group('adSessionIdProvider', () {
    test('1. sessionId stable within session', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final first = container.read(adSessionIdProvider);
      final second = container.read(adSessionIdProvider);
      expect(first, second);
      expect(first.length >= 16, isTrue);
    });

    test('13. same sessionId on refresh (provider not invalidated)', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final before = container.read(adSessionIdProvider);
      container.invalidate(homeVipBannerAdsProvider);
      final after = container.read(adSessionIdProvider);
      expect(before, after);
    });
  });

  group('AdItemModel parsing', () {
    test('4. paid response parsing', () {
      final item = AdItemModel.fromJson({
        'campaignId': 'camp-1',
        'placementId': 'pl-1',
        'placementCode': 'CATEGORY_TOP',
        'position': 2,
        'sponsored': true,
        'displayLabel': 'Реклама',
        'productType': 'TOP_CATEGORY',
        'business': {
          'id': 'biz-1',
          'title': 'Cafe',
          'slug': 'cafe',
          'address': 'Street 1',
        },
      });

      expect(item.campaignId, 'camp-1');
      expect(item.position, 2);
      expect(item.toBusinessModel()?.id, 'biz-1');
    });

    test('5. empty ads list', () {
      final response = AdServeResponse.fromJson({
        'placementCode': 'HOME_FEATURED',
        'items': [],
      });
      expect(response.items, isEmpty);
    });

    test('HOME_PROMOTIONS subset business parses without crash', () {
      final item = AdItemModel.fromJson({
        'campaignId': 'camp-promo',
        'placementId': 'pl-promo',
        'placementCode': 'HOME_PROMOTIONS',
        'position': 1,
        'sponsored': true,
        'displayLabel': 'Реклама',
        'productType': 'PROMOTED_PROMOTION',
        'promotion': {
          'id': 'promo-1',
          'title': 'Demo promo -20%',
          'description': null,
          'imageUrl': null,
          'discountText': '-20%',
          'startDate': '2026-09-05T09:15:20.411Z',
          'endDate': '2026-09-19T09:15:20.411Z',
        },
        'business': {
          'id': 'biz-1',
          'slug': 'beauty-studio',
          'title': 'Beauty Studio Elite',
        },
      });

      final promotion = item.toPromotionModel();
      expect(promotion, isNotNull);
      expect(promotion!.title, 'Demo promo -20%');
      expect(promotion.business?.title, 'Beauty Studio Elite');
      expect(promotion.business?.address, '');
    });
  });

  group('collectPaidBusinessIds', () {
    test('11. paid business deduped from organic set', () {
      final items = [
        AdItemModel.fromJson({
          'campaignId': 'c1',
          'placementId': 'p1',
          'placementCode': 'CATEGORY_TOP',
          'position': 1,
          'sponsored': true,
          'displayLabel': 'Реклама',
          'business': {'id': 'b1', 'title': 'A', 'slug': 'a', 'address': 'x'},
        }),
        AdItemModel.fromJson({
          'campaignId': 'c2',
          'placementId': 'p1',
          'placementCode': 'CATEGORY_BOOST',
          'position': 1,
          'sponsored': true,
          'displayLabel': 'Реклама',
          'business': {'id': 'b2', 'title': 'B', 'slug': 'b', 'address': 'y'},
        }),
      ];

      final ids = collectPaidBusinessIds(items);
      expect(ids, {'b1', 'b2'});
    });
  });
}
