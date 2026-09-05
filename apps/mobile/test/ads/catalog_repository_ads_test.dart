import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';

void main() {
  group('CatalogRepository ads', () {
    Dio buildDio(void Function(RequestOptions options, RequestInterceptorHandler handler) onRequest) {
      final dio = Dio();
      dio.interceptors.add(
        InterceptorsWrapper(onRequest: onRequest),
      );
      return dio;
    }

    test('2. serveAds request correct query params', () async {
      Map<String, dynamic>? params;
      final dio = buildDio((options, handler) {
        params = Map<String, dynamic>.from(options.queryParameters);
        handler.resolve(
          Response(
            requestOptions: options,
            data: {
              'placementCode': 'CATEGORY_TOP',
              'items': [],
            },
          ),
        );
      });
      final repo = CatalogRepository(dio);

      final response = await repo.serveAds(
        placementCode: 'CATEGORY_TOP',
        sessionId: 'sess123',
        citySlug: 'uralsk',
        categoryId: 'cat-1',
      );

      expect(params?['placementCode'], 'CATEGORY_TOP');
      expect(params?['sessionId'], 'sess123');
      expect(params?['citySlug'], 'uralsk');
      expect(params?['categoryId'], 'cat-1');
      expect(response, isNotNull);
    });

    test('3. categoryId included for CATEGORY_TOP', () async {
      String? categoryId;
      final dio = buildDio((options, handler) {
        categoryId = options.queryParameters['categoryId'] as String?;
        handler.resolve(
          Response(
            requestOptions: options,
            data: {'placementCode': 'CATEGORY_TOP', 'items': []},
          ),
        );
      });
      final repo = CatalogRepository(dio);

      await repo.serveAds(
        placementCode: 'CATEGORY_TOP',
        sessionId: 'sess123',
        citySlug: 'uralsk',
        categoryId: 'cat-99',
      );

      expect(categoryId, 'cat-99');
    });

    test('6. ad API error → null response', () async {
      final dio = buildDio((options, handler) {
        handler.reject(
          DioException(
            requestOptions: options,
            type: DioExceptionType.connectionError,
          ),
        );
      });
      final repo = CatalogRepository(dio);

      final response = await repo.serveAds(
        placementCode: 'HOME_VIP_BANNER',
        sessionId: 'sess123',
        citySlug: 'uralsk',
      );

      expect(response, isNull);
    });

    test('21. AD_SERVED not sent from Flutter', () async {
      Map<String, dynamic>? body;
      final dio = buildDio((options, handler) {
        body = options.data as Map<String, dynamic>?;
        handler.resolve(Response(requestOptions: options, data: {}));
      });
      final repo = CatalogRepository(dio);

      await repo.sendAdEvent(
        campaignId: 'c1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess',
        type: 'AD_IMPRESSION',
      );

      expect(body?['type'], 'AD_IMPRESSION');
      expect(body?['type'], isNot('AD_SERVED'));
    });
  });
}
