import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/map/qalago_map_bounds.dart';
import 'package:qalago_mobile/core/map/qalago_map_coordinate.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/release/app_config_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/features/map/map_businesses_notifier.dart';
import 'package:qalago_mobile/features/map/map_discovery_scope.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  const bounds = QalaGoMapBounds(
    southwest: QalaGoMapCoordinate(latitude: 50, longitude: 50),
    northeast: QalaGoMapCoordinate(latitude: 52, longitude: 52),
  );

  BusinessModel business(int n) => BusinessModel(
        id: 'b$n',
        title: 'Place $n',
        slug: 'place-$n',
        address: 'Street',
        latitude: 51 + n * 0.001,
        longitude: 51 + n * 0.001,
      );

  group('MapBusinessesNotifier', () {
    test('paginates past 100 and dedupes by id', () async {
      final pagesRequested = <int>[];
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                pagesRequested.add(page);
                if (page == 1) {
                  return PaginatedBusinesses(
                    items: List.generate(100, (i) => business(i)),
                    total: 150,
                  );
                }
                if (page == 2) {
                  return PaginatedBusinesses(
                    items: List.generate(50, (i) => business(100 + i)),
                    total: 150,
                  );
                }
                return PaginatedBusinesses(items: const [], total: 150);
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(bounds);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(mapBusinessesNotifierProvider);
      expect(pagesRequested, [1, 2]);
      expect(state.byId.length, 150);
      expect(state.byId.keys.toSet().length, 150);
    });

    test('resetForScopeChange clears data and ignores stale responses', () async {
      final completer = Completer<PaginatedBusinesses>();
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async =>
                  completer.future,
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      final pending = notifier.onViewportIdle(bounds);
      notifier.resetForScopeChange();
      completer.complete(
        PaginatedBusinesses(items: [business(1)], total: 1),
      );
      await pending;
      await Future<void>.delayed(Duration.zero);

      final state = container.read(mapBusinessesNotifierProvider);
      expect(state.byId, isEmpty);
    });
  });
}

class _MapPagingCatalogRepository extends CatalogRepository {
  _MapPagingCatalogRepository({required this.onFetch}) : super(Dio());

  final Future<PaginatedBusinesses> Function({
    required int page,
    required int limit,
  }) onFetch;

  @override
  Future<PaginatedBusinesses> fetchBusinesses({
    required String citySlug,
    String? search,
    String? categoryId,
    String? subcategoryId,
    bool? featured,
    bool? forMap,
    double? minLat,
    double? maxLat,
    double? minLng,
    double? maxLng,
    double? latitude,
    double? longitude,
    double? radiusKm,
    int? limit,
    int? page,
    String? sort,
    CancelToken? cancelToken,
  }) async {
    expect(forMap, isTrue);
    return onFetch(page: page ?? 1, limit: limit ?? 100);
  }
}

class _FixedCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        launchStatus: 'LIVE',
        centerLat: 51.2278,
        centerLng: 51.3865,
      );
}
