import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';

void main() {
  group('fetchBusinessCatalog locationId (6.12A.7.8.5)', () {
    test('page 1 and page 2 retain locationId', () async {
      final captured = <Map<String, dynamic>>[];
      final dio = Dio()
        ..interceptors.add(
          InterceptorsWrapper(
            onRequest: (options, handler) {
              captured.add(Map<String, dynamic>.from(options.queryParameters));
              handler.resolve(
                Response(
                  requestOptions: options,
                  data: {
                    'items': [],
                    'sections': [],
                    'pagination': {'page': options.queryParameters['page'], 'totalPages': 2},
                  },
                ),
              );
            },
          ),
        );
      final repo = CatalogRepository(dio);

      await repo.fetchBusinessCatalog('biz-a', page: 1, locationId: 'loc-l2');
      await repo.fetchBusinessCatalog('biz-a', page: 2, locationId: 'loc-l2');

      expect(captured.length, 2);
      expect(captured[0]['locationId'], 'loc-l2');
      expect(captured[1]['locationId'], 'loc-l2');
      expect(captured[1]['page'], 2);
    });

    test('legacy catalog omits locationId when not provided', () async {
      Map<String, dynamic>? params;
      final dio = Dio()
        ..interceptors.add(
          InterceptorsWrapper(
            onRequest: (options, handler) {
              params = Map<String, dynamic>.from(options.queryParameters);
              handler.resolve(
                Response(
                  requestOptions: options,
                  data: {'items': [], 'sections': [], 'pagination': {}},
                ),
              );
            },
          ),
        );
      final repo = CatalogRepository(dio);
      await repo.fetchBusinessCatalog('biz-a');
      expect(params?.containsKey('locationId'), isFalse);
    });
  });
}
