import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/features/home/data/home_section_type.dart';

void main() {
  group('HomeSectionType parsing', () {
    test('tryParse known types', () {
      expect(HomeSectionType.tryParse('HOME_POPULAR'), HomeSectionType.homePopular);
      expect(HomeSectionType.tryParse('NEARBY'), HomeSectionType.nearby);
      expect(HomeSectionType.tryParse('UNKNOWN_FUTURE'), isNull);
    });

    test('parseAndNormalizeHomeSections sorts by position and skips disabled/unknown', () {
      final unknown = <String>[];
      final parsed = HomeSectionType.parseAndNormalizeHomeSections(
        [
          {'type': 'HOME_POPULAR', 'enabled': true, 'position': 60},
          {'type': 'CATEGORIES', 'enabled': true, 'position': 20},
          {'type': 'FUTURE_WEB_ONLY', 'enabled': true, 'position': 99},
          {'type': 'NEARBY', 'enabled': false, 'position': 50},
        ],
        onUnknown: unknown.add,
      );
      expect(parsed, [
        HomeSectionType.categories,
        HomeSectionType.homePopular,
      ]);
      expect(unknown, ['FUTURE_WEB_ONLY']);
    });
  });

  group('CatalogRepository.fetchHomeDiscoverySections', () {
    test('builds APP request URL and parses response', () async {
      final dio = Dio();
      dio.options.baseUrl = 'http://127.0.0.1:3002/api/v1';
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            expect(options.path, '/home/sections');
            expect(options.queryParameters['citySlug'], 'uralsk');
            expect(options.queryParameters['platform'], 'APP');
            handler.resolve(
              Response(
                requestOptions: options,
                data: [
                  {'type': 'CATEGORIES', 'enabled': true, 'position': 20},
                  {'type': 'HOME_POPULAR', 'enabled': true, 'position': 60},
                ],
              ),
            );
          },
        ),
      );
      final repo = CatalogRepository(dio);
      final sections = await repo.fetchHomeDiscoverySections(citySlug: 'uralsk');
      expect(sections, [
        HomeSectionType.categories,
        HomeSectionType.homePopular,
      ]);
    });

    test('API failure surfaces to caller', () async {
      final dio = Dio();
      dio.options.baseUrl = 'http://127.0.0.1:3002/api/v1';
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            handler.reject(
              DioException(
                requestOptions: options,
                response: Response(
                  requestOptions: options,
                  statusCode: 503,
                ),
              ),
            );
          },
        ),
      );
      final repo = CatalogRepository(dio);
      expect(
        () => repo.fetchHomeDiscoverySections(citySlug: 'uralsk'),
        throwsA(isA<DioException>()),
      );
    });
  });

  test('fallback order matches backend canonical bootstrap (6.13M.7)', () {
    expect(
      kHomeDiscoverySectionFallback,
      [
        HomeSectionType.homeVipBanner,
        HomeSectionType.categories,
        HomeSectionType.homeFeatured,
        HomeSectionType.homePromotions,
        HomeSectionType.nearby,
        HomeSectionType.homePopular,
      ],
    );
  });
}
