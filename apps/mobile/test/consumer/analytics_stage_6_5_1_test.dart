import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/analytics/services/analytics_impression_controller.dart';
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
  group('Stage 6.5.1 analytics instrumentation', () {
    test('map impression dedup uses MAP_PIN surface key', () {
      final controller = AnalyticsImpressionController();
      final key = AnalyticsImpressionController.businessKey('biz-1', 'MAP_PIN');
      expect(controller.hasSent(key), isFalse);
      controller.markSent(key);
      expect(controller.hasSent(key), isTrue);
    });

    test('catalog impression dedup uses catalog surface key', () {
      final controller = AnalyticsImpressionController();
      final key =
          AnalyticsImpressionController.catalogKey('item-1', 'CATALOG_SCREEN');
      controller.markSent(key);
      expect(controller.hasSent(key), isTrue);
    });

    test('trackBusinessView from SEARCH includes discoverySurface and identity', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessView(
        'biz-1',
        trafficSource: BusinessTrafficSource.search,
        searchQuery: 'кофе',
        discoverySurface: 'SEARCH_RESULTS',
        visitorId: 'a' * 32,
        sessionId: 'b' * 32,
      );

      final payload = dio.payloads.single;
      expect(payload['businessId'], 'biz-1');
      expect(payload['type'], 'VIEW_BUSINESS');
      expect(payload['trafficSource'], 'SEARCH');
      expect(payload['searchQuery'], 'кофе');
      expect(payload['discoverySurface'], 'SEARCH_RESULTS');
      expect(payload['visitorId'], 'a' * 32);
      expect(payload['sessionId'], 'b' * 32);
      expect(payload['clientEventId'], isNotNull);
      expect(payload['platform'], isNotNull);
    });

    test('trackBusinessView from MAP includes MAP_PIN discoverySurface', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessView(
        'biz-1',
        trafficSource: BusinessTrafficSource.map,
        discoverySurface: BusinessTrafficSource.map.openDiscoverySurface,
      );

      expect(dio.payloads.single['trafficSource'], 'MAP');
      expect(dio.payloads.single['discoverySurface'], 'MAP_PIN');
    });

    test('trackCatalogItemImpression requires catalogItemId', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackCatalogItemImpression(
        'biz-1',
        catalogItemId: 'item-42',
      );

      expect(dio.payloads.single['type'], 'CATALOG_ITEM_IMPRESSION');
      expect(dio.payloads.single['catalogItemId'], 'item-42');
    });

    test('trackReviewCreated sends REVIEW_CREATED without review text', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackReviewCreated('biz-1');

      final payload = dio.payloads.single;
      expect(payload['type'], 'REVIEW_CREATED');
      expect(payload.containsKey('text'), isFalse);
      expect(payload.containsKey('rating'), isFalse);
    });

    test('trackReviewsView sends REVIEWS_VIEW', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackReviewsView('biz-1');

      expect(dio.payloads.single['type'], 'REVIEWS_VIEW');
    });

    test('catalog and map tracking remain non-blocking on API failure', () async {
      final dio = Dio();
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            handler.reject(
              DioException(
                requestOptions: options,
                type: DioExceptionType.connectionTimeout,
              ),
            );
          },
        ),
      );
      final repo = CatalogRepository(dio);

      await expectLater(
        repo.trackCatalogItemImpression('biz-1', catalogItemId: 'item-1'),
        completes,
      );
      await expectLater(
        repo.trackBusinessImpression(
          'biz-1',
          trafficSource: BusinessTrafficSource.map,
          discoverySurface: 'MAP_PIN',
        ),
        completes,
      );
    });
  });
}
