import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/analytics/services/analytics_impression_controller.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';

void main() {
  group('Stage 6.5 analytics instrumentation', () {
    test('impression controller deduplicates per session key', () {
      final controller = AnalyticsImpressionController();
      const key = 'business:b1:SEARCH_RESULTS';
      expect(controller.hasSent(key), isFalse);
      controller.markSent(key);
      expect(controller.hasSent(key), isTrue);
    });

    test('trackBusinessImpression is non-blocking on API failure', () async {
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
        repo.trackBusinessImpression(
          'biz-1',
          trafficSource: BusinessTrafficSource.search,
          discoverySurface: 'SEARCH_RESULTS',
          visitorId: 'a' * 32,
          sessionId: 'b' * 32,
        ),
        completes,
      );
    });

    test('trackPromotionView sends promotionId when provided', () async {
      Map<String, dynamic>? captured;
      final dio = Dio();
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            captured = options.data as Map<String, dynamic>?;
            handler.resolve(
              Response(requestOptions: options, statusCode: 201, data: {'success': true}),
            );
          },
        ),
      );
      final repo = CatalogRepository(dio);
      await repo.trackPromotionView('biz-1', promotionId: 'promo-1');

      expect(captured?['type'], 'PROMOTION_VIEW');
      expect(captured?['promotionId'], 'promo-1');
      expect(captured?['clientEventId'], isNotNull);
    });
  });
}
