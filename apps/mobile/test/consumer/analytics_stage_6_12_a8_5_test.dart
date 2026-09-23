import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/analytics/utils/analytics_branch_context.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';

class _RecordingDio implements Dio {
  final List<Map<String, dynamic>> payloads = [];

  @override
  Future<Response<T>> post<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    payloads.add(Map<String, dynamic>.from(data as Map));
    return Response(
      requestOptions: RequestOptions(path: path),
      data: {'success': true} as T,
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('A.8.5 analytics branch attribution', () {
    test('VIEW_BUSINESS sends businessLocationId L2', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessView(
        'biz-b',
        businessLocationId: 'loc-l2',
      );

      expect(dio.payloads.single['businessLocationId'], 'loc-l2');
      expect(dio.payloads.single['type'], 'VIEW_BUSINESS');
    });

    test('WHATSAPP_CLICK sends effective branch L2', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackWhatsappClick(
        'biz-b',
        businessLocationId: 'loc-l2',
      );

      expect(dio.payloads.single['businessLocationId'], 'loc-l2');
    });

    test('BUSINESS_IMPRESSION uses contextLocationId L2', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessImpression(
        'biz-b',
        trafficSource: BusinessTrafficSource.home,
        businessLocationId: analyticsBranchFromBusinessContext('loc-l2'),
      );

      expect(dio.payloads.single['businessLocationId'], 'loc-l2');
      expect(dio.payloads.single['type'], 'BUSINESS_IMPRESSION');
    });

    test('SEARCH impression with context L2', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessImpression(
        'biz-b',
        trafficSource: BusinessTrafficSource.search,
        searchQuery: 'coffee',
        businessLocationId: 'loc-l2',
      );

      expect(dio.payloads.single['type'], 'SEARCH_RESULT_IMPRESSION');
      expect(dio.payloads.single['businessLocationId'], 'loc-l2');
    });

    test('impression without context omits location', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessImpression(
        'biz-b',
        trafficSource: BusinessTrafficSource.home,
        businessLocationId: analyticsBranchFromBusinessContext(null),
      );

      expect(dio.payloads.single.containsKey('businessLocationId'), isFalse);
    });

    test('PROMOTION_VIEW in detail sends branch', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackPromotionView(
        'biz-b',
        promotionId: 'promo-1',
        businessLocationId: 'loc-l2',
      );

      expect(dio.payloads.single['businessLocationId'], 'loc-l2');
    });

    test('CATALOG_ITEM_VIEW sends branch', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackCatalogItemView(
        'biz-b',
        catalogItemId: 'item-1',
        businessLocationId: 'loc-l2',
      );

      expect(dio.payloads.single['businessLocationId'], 'loc-l2');
    });

    test('FAVORITE_ADD omits branch', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackFavoriteAdd('biz-b');

      expect(dio.payloads.single.containsKey('businessLocationId'), isFalse);
    });

    test('REVIEWS_VIEW omits branch', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackReviewsView('biz-b');

      expect(dio.payloads.single.containsKey('businessLocationId'), isFalse);
    });

    test('effectiveAnalyticsBranchId uses activeLocationId only', () {
      expect(
        effectiveAnalyticsBranchId(
          detailData: {'activeLocationId': 'loc-l2'},
        ),
        'loc-l2',
      );
      expect(
        effectiveAnalyticsBranchId(
          detailData: {'activeLocationId': null, 'id': 'biz-b'},
        ),
        isNull,
      );
    });
  });
}
