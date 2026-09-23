import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/features/ads/data/ad_models.dart';
import 'package:qalago_mobile/features/ads/services/ad_impression_controller.dart';
import 'package:qalago_mobile/features/ads/services/ad_tracking_service.dart';
import 'package:qalago_mobile/features/ads/widgets/vip_banner_ad.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';

import '../support/l10n_test_harness.dart';

const _businessId = 'cmpn1wnq1000iult8yj6a06q7';
const _promotionId = 'cmuekpm9t000bulzonu6dxy9l';
const _l2 = 'cmuekpm660001ulzouphv3fdk';

AdItemModel _vipPromotionServeItem({
  String? destinationLocationId,
  String? contextLocationId,
  Map<String, dynamic>? business,
}) {
  return AdItemModel.fromJson({
    'campaignId': 'cmuekpmb4000rulzohbuazz18',
    'placementCode': 'HOME_VIP_BANNER',
    'placementId': 'pl-vip',
    'position': 1,
    'sponsored': true,
    'displayLabel': 'Реклама',
    'productType': 'VIP_BANNER',
    'destinationLocationId': destinationLocationId,
    'contextLocationId': contextLocationId,
    'creative': {
      'id': 'cr-vip-promo',
      'type': 'BANNER',
      'title': 'VIP PROMOTION QA',
      'targetType': 'PROMOTION',
      'targetId': _promotionId,
    },
    'business': business ?? {'id': _businessId, 'slug': 'bar-code-51'},
  });
}

class _FakeCatalog extends CatalogRepository {
  _FakeCatalog() : super(Dio(BaseOptions(baseUrl: 'http://test')));

  @override
  Future<bool> sendAdEvent({
    required String campaignId,
    required String placementCode,
    required String sessionId,
    required String type,
    int? position,
  }) async {
    return true;
  }
}

void main() {
  testWidgets('VIP PROMOTION tap navigates Business B with location L2', (tester) async {
    final item = _vipPromotionServeItem(
      destinationLocationId: _l2,
      contextLocationId: _l2,
    );
    expect(item.promotion, isNull);
    expect(item.toPromotionModel(), isNull);

    String? navigatedUri;
    final router = GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => Scaffold(
            body: SizedBox(
              width: 400,
              height: 400,
              child: VipBannerAd(item: item),
            ),
          ),
        ),
        GoRoute(
          path: '/business/:id',
          builder: (context, state) {
            navigatedUri = state.uri.toString();
            return const Scaffold(body: Text('detail'));
          },
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          adTrackingServiceProvider.overrideWith(
            (ref) => AdTrackingService(
              catalog: _FakeCatalog(),
              impressions: AdImpressionController(),
            ),
          ),
        ],
        child: wrapRouterWithL10n(router),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byType(InkWell).first);
    await tester.pumpAndSettle();

    expect(navigatedUri, isNotNull);
    expect(navigatedUri, contains('/business/$_businessId'));
    expect(navigatedUri, isNot(contains('/business/$_promotionId')));
    expect(navigatedUri, contains('locationId=$_l2'));
    expect(navigatedUri, contains('source=AD'));
  });
}
