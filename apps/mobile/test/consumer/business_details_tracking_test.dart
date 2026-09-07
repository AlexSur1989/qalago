import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/navigation/business_traffic_source.dart';
import 'package:qalago_mobile/shared/utils/audience_distance_bucket.dart';

class _RecordingDio implements Dio {
  Map<String, dynamic>? lastPayload;

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
    lastPayload = data as Map<String, dynamic>?;
    return Response(
      requestOptions: RequestOptions(path: path),
      data: {'success': true} as T,
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('CatalogRepository traffic source tracking', () {
    test('trackBusinessView sends trafficSource for SEARCH', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessView(
        'biz-1',
        trafficSource: BusinessTrafficSource.search,
        searchQuery: 'кофе рядом',
      );

      expect(dio.lastPayload, {
        'businessId': 'biz-1',
        'type': 'VIEW_BUSINESS',
        'trafficSource': 'SEARCH',
        'searchQuery': 'кофе рядом',
      });
    });

    test('trackBusinessView omits searchQuery for HOME source', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessView(
        'biz-1',
        trafficSource: BusinessTrafficSource.home,
        searchQuery: 'кофе',
      );

      expect(dio.lastPayload, {
        'businessId': 'biz-1',
        'type': 'VIEW_BUSINESS',
        'trafficSource': 'HOME',
      });
    });

    test('trackBusinessView omits searchQuery when not provided for SEARCH', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessView(
        'biz-1',
        trafficSource: BusinessTrafficSource.search,
      );

      expect(dio.lastPayload, {
        'businessId': 'biz-1',
        'type': 'VIEW_BUSINESS',
        'trafficSource': 'SEARCH',
      });
    });

    test('trackBusinessView sends audienceDistanceBucket', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessView(
        'biz-1',
        trafficSource: BusinessTrafficSource.search,
        searchQuery: 'кофе',
        audienceDistanceBucket: AudienceDistanceBucket.km1_3,
      );

      expect(dio.lastPayload, {
        'businessId': 'biz-1',
        'type': 'VIEW_BUSINESS',
        'trafficSource': 'SEARCH',
        'searchQuery': 'кофе',
        'audienceDistanceBucket': 'KM_1_3',
      });
    });

    test('payload never includes raw coordinates', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessView(
        'biz-1',
        audienceDistanceBucket: AudienceDistanceBucket.unknown,
      );

      expect(dio.lastPayload?.containsKey('userLatitude'), isFalse);
      expect(dio.lastPayload?.containsKey('userLongitude'), isFalse);
      expect(dio.lastPayload?.containsKey('rawDistanceKm'), isFalse);
    });

    test('trackBusinessView omits trafficSource when not provided', () async {
      final dio = _RecordingDio();
      final repo = CatalogRepository(dio);

      await repo.trackBusinessView('biz-1');

      expect(dio.lastPayload, {
        'businessId': 'biz-1',
        'type': 'VIEW_BUSINESS',
      });
    });

    test('all navigation sources map to API enum values', () {
      expect(BusinessTrafficSource.home.apiValue, 'HOME');
      expect(BusinessTrafficSource.ad.apiValue, 'AD');
      expect(BusinessTrafficSource.direct.apiValue, 'DIRECT');
    });
  });
}
