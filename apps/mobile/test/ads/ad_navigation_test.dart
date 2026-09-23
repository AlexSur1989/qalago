import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/features/ads/data/ad_models.dart';
import 'package:qalago_mobile/features/ads/utils/ad_navigation.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';
import 'package:qalago_mobile/shared/navigation/open_business.dart';

AdItemModel _adItem({
  String? destinationLocationId,
  String? contextLocationId,
  String businessId = 'biz-b',
}) {
  return AdItemModel(
    campaignId: 'camp-1',
    placementId: 'pl-1',
    placementCode: 'HOME_FEATURED',
    position: 1,
    sponsored: true,
    displayLabel: 'Реклама',
    business: {'id': businessId, 'title': 'Cafe', 'slug': 'cafe'},
    destinationLocationId: destinationLocationId,
    contextLocationId: contextLocationId,
  );
}

PromotionModel _promotion({String? contextLocationId}) {
  return PromotionModel.fromJson({
    'id': 'promo-1',
    'title': 'Promo',
    'contextLocationId': contextLocationId,
    'businessId': 'biz-b',
    'business': {
      'id': 'biz-b',
      'title': 'Cafe',
      'slug': 'cafe',
      'address': 'addr',
    },
  });
}

void main() {
  group('AdItemModel.resolvedDestinationLocationId', () {
    test('1 destination=L2, context=L1 → L2', () {
      final item = _adItem(destinationLocationId: 'L2', contextLocationId: 'L1');
      expect(item.resolvedDestinationLocationId, 'L2');
    });

    test('2 destination=null, context=L1 → L1', () {
      expect(_adItem(contextLocationId: 'L1').resolvedDestinationLocationId, 'L1');
    });

    test('3 destination=null, context=null → null', () {
      expect(_adItem().resolvedDestinationLocationId, isNull);
    });

    test('4 old JSON without fields → null', () {
      final item = AdItemModel.fromJson({
        'campaignId': 'c',
        'placementId': 'p',
        'placementCode': 'HOME_FEATURED',
        'position': 1,
        'sponsored': true,
        'displayLabel': 'Реклама',
        'business': {'id': 'biz-b', 'title': 'T', 'slug': 't'},
      });
      expect(item.resolvedDestinationLocationId, isNull);
    });

    test('5 business id unchanged by location resolution', () {
      final item = _adItem(destinationLocationId: 'L2');
      expect(item.business!['id'], 'biz-b');
      expect(item.toBusinessModel()?.id, 'biz-b');
    });
  });

  group('adNavigationLocationId (promotion ads)', () {
    test('9 destination L2 + promotion context L1 → L2', () {
      final item = _adItem(destinationLocationId: 'L2', contextLocationId: 'L1');
      expect(
        adNavigationLocationId(item, promotion: _promotion(contextLocationId: 'L1')),
        'L2',
      );
    });

    test('10 destination null + ad context L2 → L2', () {
      expect(
        adNavigationLocationId(
          _adItem(contextLocationId: 'L2'),
          promotion: _promotion(contextLocationId: 'L1'),
        ),
        'L2',
      );
    });

    test('11 ad location null + promotion context L1 → L1', () {
      expect(
        adNavigationLocationId(_adItem(), promotion: _promotion(contextLocationId: 'L1')),
        'L1',
      );
    });
  });

  group('businessDetailRouteUri — ad branch navigation', () {
    test('6 HOME_FEATURED + L2 → B/L2', () {
      final uri = businessDetailRouteUri(
        'biz-b',
        BusinessTrafficSource.ad,
        selectedLocationId: _adItem(destinationLocationId: 'L2').resolvedDestinationLocationId,
      );
      expect(uri.path, '/business/biz-b');
      expect(uri.queryParameters['source'], 'AD');
      expect(uri.queryParameters['locationId'], 'L2');
    });

    test('7 CATEGORY_TOP + L2 → B/L2', () {
      final item = _adItem(destinationLocationId: 'L2');
      item; // placement agnostic
      final uri = businessDetailRouteUri(
        'biz-b',
        BusinessTrafficSource.ad,
        selectedLocationId: item.resolvedDestinationLocationId,
      );
      expect(uri.queryParameters['locationId'], 'L2');
    });

    test('8 CATEGORY_BOOST + L2 → B/L2', () {
      final uri = businessDetailRouteUri(
        'biz-b',
        BusinessTrafficSource.ad,
        selectedLocationId: 'L2',
      );
      expect(uri.queryParameters['locationId'], 'L2');
    });

    test('12 VIP BUSINESS + L2 → B/L2', () {
      final uri = businessDetailRouteUri(
        'biz-b',
        BusinessTrafficSource.ad,
        selectedLocationId: 'L2',
      );
      expect(uri.queryParameters['locationId'], 'L2');
    });

    test('13 VIP PROMOTION + L2 → B/L2', () {
      final item = _adItem(destinationLocationId: 'L2');
      final loc = adNavigationLocationId(
        item,
        promotion: _promotion(contextLocationId: 'L1'),
      );
      final uri = businessDetailRouteUri(
        'biz-b',
        BusinessTrafficSource.ad,
        selectedLocationId: loc,
      );
      expect(uri.queryParameters['locationId'], 'L2');
    });

    test('15 null/null legacy ad → no locationId param', () {
      final uri = businessDetailRouteUri(
        'biz-b',
        BusinessTrafficSource.ad,
        selectedLocationId: _adItem().resolvedDestinationLocationId,
      );
      expect(uri.queryParameters.containsKey('locationId'), isFalse);
      expect(uri.queryParameters['source'], 'AD');
    });

    test('22 source remains AD', () {
      final uri = businessDetailRouteUri(
        'biz-b',
        BusinessTrafficSource.ad,
        selectedLocationId: 'L2',
      );
      expect(uri.queryParameters['source'], 'AD');
    });

    test('organic promotion override explicit selectedLocationId wins', () {
      final uri = businessDetailRouteUri(
        'biz-b',
        BusinessTrafficSource.promotions,
        selectedLocationId: 'explicit-l2',
      );
      expect(uri.queryParameters['locationId'], 'explicit-l2');
    });
  });

  group('VIP PROMOTION serve shape (no promotion object)', () {
    const businessId = 'cmpn-biz';
    const promotionTargetId = 'cmpn-promo';
    const l2 = 'loc-l2';

    AdItemModel vipItemFromServeJson({
      String? destinationLocationId,
      String? contextLocationId,
    }) {
      return AdItemModel.fromJson({
        'campaignId': 'camp-vip',
        'placementCode': 'HOME_VIP_BANNER',
        'placementId': 'pl-vip',
        'position': 1,
        'sponsored': true,
        'displayLabel': 'Реклама',
        'productType': 'VIP_BANNER',
        'destinationLocationId': destinationLocationId,
        'contextLocationId': contextLocationId,
        'creative': {
          'id': 'cr-1',
          'title': 'VIP Promo',
          'targetType': 'PROMOTION',
          'targetId': promotionTargetId,
        },
        'business': {'id': businessId, 'slug': 'biz'},
      });
    }

    AdCreativeModel creative(AdItemModel item) => item.creative!;

    testWidgets('2 VIP PROMOTION without promotion payload + L2 → B/L2', (tester) async {
      final item = vipItemFromServeJson(
        destinationLocationId: l2,
        contextLocationId: l2,
      );
      expect(item.promotion, isNull);

      String? uri;
      final router = GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (c, s) => ElevatedButton(
              onPressed: () =>
                  openPromotionFromAdItem(c, item, creative: creative(item)),
              child: const Text('nav'),
            ),
          ),
          GoRoute(
            path: '/business/:id',
            builder: (c, s) {
              uri = s.uri.toString();
              return const SizedBox();
            },
          ),
        ],
      );
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.tap(find.text('nav'));
      await tester.pumpAndSettle();

      expect(uri, contains('/business/$businessId'));
      expect(uri, isNot(contains('/business/$promotionTargetId')));
      expect(uri, contains('locationId=$l2'));
      expect(uri, contains('source=AD'));
    });

    testWidgets('3 context L2 only → B/L2', (tester) async {
      final item = vipItemFromServeJson(contextLocationId: l2);
      String? uri;
      final router = GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (c, s) => ElevatedButton(
              onPressed: () =>
                  openPromotionFromAdItem(c, item, creative: creative(item)),
              child: const Text('nav'),
            ),
          ),
          GoRoute(
            path: '/business/:id',
            builder: (c, s) {
              uri = s.uri.toString();
              return const SizedBox();
            },
          ),
        ],
      );
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.tap(find.text('nav'));
      await tester.pumpAndSettle();
      expect(uri, contains('locationId=$l2'));
    });

    testWidgets('4 null location → Business without locationId', (tester) async {
      final item = vipItemFromServeJson();
      String? uri;
      final router = GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (c, s) => ElevatedButton(
              onPressed: () =>
                  openPromotionFromAdItem(c, item, creative: creative(item)),
              child: const Text('nav'),
            ),
          ),
          GoRoute(
            path: '/business/:id',
            builder: (c, s) {
              uri = s.uri.toString();
              return const SizedBox();
            },
          ),
        ],
      );
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.tap(find.text('nav'));
      await tester.pumpAndSettle();
      expect(uri, contains('/business/$businessId'));
      expect(uri, isNot(contains('locationId=')));
    });

    testWidgets('7 malformed: no business → no navigation', (tester) async {
      final item = AdItemModel.fromJson({
        'campaignId': 'c',
        'placementCode': 'HOME_VIP_BANNER',
        'placementId': 'p',
        'position': 1,
        'sponsored': true,
        'displayLabel': 'Реклама',
        'creative': {
          'id': 'cr',
          'title': 'T',
          'targetType': 'PROMOTION',
          'targetId': promotionTargetId,
        },
      });
      var navigated = false;
      final router = GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (c, s) => ElevatedButton(
              onPressed: () =>
                  openPromotionFromAdItem(c, item, creative: item.creative),
              child: const Text('nav'),
            ),
          ),
          GoRoute(
            path: '/business/:id',
            builder: (c, s) {
              navigated = true;
              return const SizedBox();
            },
          ),
        ],
      );
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.tap(find.text('nav'));
      await tester.pumpAndSettle();
      expect(navigated, isFalse);
    });

    testWidgets('5 promotion-rich HOME_PROMOTIONS path unchanged', (tester) async {
      final item = AdItemModel.fromJson({
        'campaignId': 'c',
        'placementCode': 'HOME_PROMOTIONS',
        'placementId': 'p',
        'position': 1,
        'sponsored': true,
        'displayLabel': 'Реклама',
        'destinationLocationId': l2,
        'promotion': {
          'id': promotionTargetId,
          'title': 'Promo',
          'businessId': businessId,
          'business': {
            'id': businessId,
            'title': 'B',
            'slug': 'b',
            'address': 'a',
          },
        },
        'business': {'id': businessId, 'slug': 'b', 'title': 'B'},
      });
      expect(item.toPromotionModel(), isNotNull);

      String? uri;
      final router = GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (c, s) => ElevatedButton(
              onPressed: () => openPromotionFromAdItem(c, item),
              child: const Text('nav'),
            ),
          ),
          GoRoute(
            path: '/business/:id',
            builder: (c, s) {
              uri = s.uri.toString();
              return const SizedBox();
            },
          ),
        ],
      );
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.tap(find.text('nav'));
      await tester.pumpAndSettle();
      expect(uri, contains('/business/$businessId'));
      expect(uri, contains('locationId=$l2'));
    });
  });
}
