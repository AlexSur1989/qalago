import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/analytics/utils/analytics_platform.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';

void main() {
  tearDown(resetAnalyticsPlatformOverrideForTesting);

  group('qalagoAnalyticsPlatform helper', () {
    test('1 — override Android → ANDROID', () {
      analyticsPlatformOverrideForTesting = 'ANDROID';
      expect(qalagoAnalyticsPlatform(), 'ANDROID');
    });

    test('2 — override iOS → IOS', () {
      analyticsPlatformOverrideForTesting = 'IOS';
      expect(qalagoAnalyticsPlatform(), 'IOS');
    });

    test('3 — override web → WEB', () {
      analyticsPlatformOverrideForTesting = 'WEB';
      expect(qalagoAnalyticsPlatform(), 'WEB');
    });

    test('4 — override unknown runtime → UNKNOWN', () {
      analyticsPlatformOverrideForTesting = 'UNKNOWN';
      expect(qalagoAnalyticsPlatform(), 'UNKNOWN');
    });
  });

  group('A.8.6 ad platform payloads', () {
    Dio buildRecordingDio(void Function(RequestOptions options) capture) {
      final dio = Dio();
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            capture(options);
            final data = options.path.contains('/serve')
                ? <String, dynamic>{
                    'placementCode': options.queryParameters['placementCode'],
                    'items': <dynamic>[],
                  }
                : <String, dynamic>{};
            handler.resolve(Response(requestOptions: options, data: data));
          },
        ),
      );
      return dio;
    }

    setUp(() {
      analyticsPlatformOverrideForTesting = 'ANDROID';
    });

    test('5–9 — sendAdEvent includes platform on AD_IMPRESSION/CLICK/CARD/PROMO', () async {
      final bodies = <Map<String, dynamic>>[];
      final dio = buildRecordingDio((options) {
        bodies.add(Map<String, dynamic>.from(options.data as Map));
      });
      final repo = CatalogRepository(dio);

      await repo.sendAdEvent(
        campaignId: 'c1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess',
        type: 'AD_IMPRESSION',
      );
      await repo.sendAdEvent(
        campaignId: 'c1',
        placementCode: 'HOME_VIP_BANNER',
        sessionId: 'sess',
        type: 'AD_CLICK',
      );
      await repo.sendAdEvent(
        campaignId: 'c1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess',
        type: 'AD_CARD_OPEN',
      );
      await repo.sendAdEvent(
        campaignId: 'c1',
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess',
        type: 'AD_PROMOTION_OPEN',
      );

      expect(bodies, hasLength(4));
      for (final body in bodies) {
        expect(body['platform'], 'ANDROID');
      }
    });

    test('10 — serveAds query includes platform', () async {
      Map<String, dynamic>? params;
      final dio = buildRecordingDio((options) {
        params = Map<String, dynamic>.from(options.queryParameters);
      });
      final repo = CatalogRepository(dio);

      await repo.serveAds(
        placementCode: 'HOME_VIP_BANNER',
        sessionId: 'sess123',
        citySlug: 'uralsk',
      );

      expect(params?['platform'], 'ANDROID');
    });

    test('11 — organic track uses same canonical helper', () async {
      analyticsPlatformOverrideForTesting = 'IOS';
      Map<String, dynamic>? body;
      final dio = buildRecordingDio((options) {
        body = Map<String, dynamic>.from(options.data as Map);
      });
      final repo = CatalogRepository(dio);

      await repo.trackBusinessView('biz-b');

      expect(body?['platform'], 'IOS');
      expect(body?['type'], 'VIEW_BUSINESS');
    });
  });
}
