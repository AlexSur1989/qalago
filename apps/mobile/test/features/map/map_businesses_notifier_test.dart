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
      expect(state.byLocationId.length, 150);
      expect(state.byLocationId.keys.toSet().length, 150);
    });

    test('empty viewport fetch sets viewportTotal without implying city empty',
        () async {
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async =>
                  PaginatedBusinesses(items: const [], total: 0),
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(bounds);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(mapBusinessesNotifierProvider);
      expect(state.viewportTotal, 0);
      expect(state.byLocationId, isEmpty);
    });

    test('refetch populated viewport restores businesses', () async {
      var call = 0;
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                call++;
                if (call == 1) {
                  return PaginatedBusinesses(items: const [], total: 0);
                }
                return PaginatedBusinesses(
                  items: [business(1)],
                  total: 1,
                );
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(bounds);
      await Future<void>.delayed(Duration.zero);
      expect(container.read(mapBusinessesNotifierProvider).byLocationId, isEmpty);

      await notifier.onViewportIdle(
        const QalaGoMapBounds(
          southwest: QalaGoMapCoordinate(latitude: 48, longitude: 48),
          northeast: QalaGoMapCoordinate(latitude: 49, longitude: 49),
        ),
      );
      await Future<void>.delayed(Duration.zero);

      final state = container.read(mapBusinessesNotifierProvider);
      expect(state.viewportTotal, 1);
      expect(state.byLocationId.length, 1);
    });

    test('merge keeps multiple locations for same business across pages', () async {
      BusinessModel row(String locId, double lat) => BusinessModel(
            id: 'b-shared',
            locationId: locId,
            title: 'Shared',
            slug: 'shared',
            address: 'Addr $locId',
            latitude: lat,
            longitude: 51.39,
          );

      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                if (page == 1) {
                  return PaginatedBusinesses(
                    items: [row('loc-a', 51.01)],
                    total: 2,
                  );
                }
                return PaginatedBusinesses(
                  items: [row('loc-b', 51.02)],
                  total: 2,
                );
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
      expect(state.byLocationId.length, 2);
      expect(state.byLocationId['loc-a']?.id, 'b-shared');
      expect(state.byLocationId['loc-b']?.address, 'Addr loc-b');
    });

    test('B — second identical viewport idle does not refetch (C2)', () async {
      var fetchCalls = 0;
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                fetchCalls++;
                return PaginatedBusinesses(
                  items: [business(1)],
                  total: 1,
                );
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      const visible = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.10, longitude: 51.20),
        northeast: QalaGoMapCoordinate(latitude: 51.30, longitude: 51.50),
      );

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(visible);
      await Future<void>.delayed(Duration.zero);
      expect(fetchCalls, 1);
      expect(
        container.read(mapBusinessesNotifierProvider).lastFetchBounds,
        visible.padded(0.12),
      );

      await notifier.onViewportIdle(visible);
      await Future<void>.delayed(Duration.zero);
      expect(fetchCalls, 1);
    });

    test('C — small pan inside padded coverage does not refetch', () async {
      var fetchCalls = 0;
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                fetchCalls++;
                return PaginatedBusinesses(items: [business(1)], total: 1);
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      const visible = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.10, longitude: 51.20),
        northeast: QalaGoMapCoordinate(latitude: 51.30, longitude: 51.50),
      );
      const panned = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.105, longitude: 51.21),
        northeast: QalaGoMapCoordinate(latitude: 51.305, longitude: 51.51),
      );

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(visible);
      await Future<void>.delayed(Duration.zero);
      await notifier.onViewportIdle(panned);
      await Future<void>.delayed(Duration.zero);
      expect(fetchCalls, 1);
    });

    test('D — pan outside fetched coverage triggers new fetch', () async {
      var fetchCalls = 0;
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                fetchCalls++;
                return PaginatedBusinesses(items: [business(fetchCalls)], total: 1);
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      const visible = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.10, longitude: 51.20),
        northeast: QalaGoMapCoordinate(latitude: 51.30, longitude: 51.50),
      );
      final outside = visible.padded(0.12);
      final exitsNorth = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(
          latitude: 51.10,
          longitude: 51.20,
        ),
        northeast: QalaGoMapCoordinate(
          latitude: outside.maxLat + 0.01,
          longitude: 51.50,
        ),
      );

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(visible);
      await Future<void>.delayed(Duration.zero);
      await notifier.onViewportIdle(exitsNorth);
      await Future<void>.delayed(Duration.zero);
      expect(fetchCalls, 2);
    });

    test('E — zoom in within coverage does not refetch', () async {
      var fetchCalls = 0;
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                fetchCalls++;
                return PaginatedBusinesses(items: [business(1)], total: 1);
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      const visible = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.10, longitude: 51.20),
        northeast: QalaGoMapCoordinate(latitude: 51.30, longitude: 51.50),
      );
      const zoomIn = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.15, longitude: 51.25),
        northeast: QalaGoMapCoordinate(latitude: 51.25, longitude: 51.45),
      );

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(visible);
      await Future<void>.delayed(Duration.zero);
      await notifier.onViewportIdle(zoomIn);
      await Future<void>.delayed(Duration.zero);
      expect(fetchCalls, 1);
    });

    test('F — zoom out beyond coverage refetches', () async {
      var fetchCalls = 0;
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                fetchCalls++;
                return PaginatedBusinesses(items: [business(1)], total: 1);
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      const zoomIn = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.15, longitude: 51.25),
        northeast: QalaGoMapCoordinate(latitude: 51.25, longitude: 51.45),
      );
      final coverage = zoomIn.padded(0.12);
      final zoomOut = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(
          latitude: coverage.minLat - 0.01,
          longitude: coverage.minLng - 0.01,
        ),
        northeast: QalaGoMapCoordinate(
          latitude: coverage.maxLat + 0.01,
          longitude: coverage.maxLng + 0.01,
        ),
      );

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(zoomIn);
      await Future<void>.delayed(Duration.zero);
      await notifier.onViewportIdle(zoomOut);
      await Future<void>.delayed(Duration.zero);
      expect(fetchCalls, 2);
    });

    test('G — scope reset clears coverage and next idle fetches', () async {
      var fetchCalls = 0;
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                fetchCalls++;
                return PaginatedBusinesses(items: [business(1)], total: 1);
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      const visible = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.10, longitude: 51.20),
        northeast: QalaGoMapCoordinate(latitude: 51.30, longitude: 51.50),
      );

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(visible);
      await Future<void>.delayed(Duration.zero);
      notifier.resetForScopeChange();
      await notifier.onViewportIdle(visible);
      await Future<void>.delayed(Duration.zero);
      expect(fetchCalls, 2);
      expect(
        container.read(mapBusinessesNotifierProvider).lastFetchBounds,
        visible.padded(0.12),
      );
    });

    test('H — failed fetch leaves viewport eligible for retry', () async {
      var fetchCalls = 0;
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _CountingThrowingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                fetchCalls++;
                if (fetchCalls == 1) {
                  throw DioException(requestOptions: RequestOptions(path: '/'));
                }
                return PaginatedBusinesses(items: [business(1)], total: 1);
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      const visible = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.10, longitude: 51.20),
        northeast: QalaGoMapCoordinate(latitude: 51.30, longitude: 51.50),
      );

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(visible);
      await Future<void>.delayed(Duration.zero);
      expect(
        container.read(mapBusinessesNotifierProvider).lastFetchBounds,
        isNull,
      );

      await notifier.retry();
      await Future<void>.delayed(Duration.zero);
      expect(fetchCalls, 2);
      expect(container.read(mapBusinessesNotifierProvider).byLocationId.length, 1);
    });

    test('I — stale fetch does not establish coverage', () async {
      final firstWave = Completer<PaginatedBusinesses>();
      final secondWave = Completer<PaginatedBusinesses>();
      var wave = 0;
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                wave++;
                if (wave == 1) return firstWave.future;
                return secondWave.future;
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      const visible = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.10, longitude: 51.20),
        northeast: QalaGoMapCoordinate(latitude: 51.30, longitude: 51.50),
      );
      final outside = visible.padded(0.12);
      final exitsNorth = QalaGoMapBounds(
        southwest: const QalaGoMapCoordinate(latitude: 51.10, longitude: 51.20),
        northeast: QalaGoMapCoordinate(
          latitude: outside.maxLat + 0.01,
          longitude: 51.50,
        ),
      );

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      final pendingFirst = notifier.onViewportIdle(visible);
      final pendingSecond = notifier.onViewportIdle(exitsNorth);

      firstWave.complete(
        PaginatedBusinesses(items: [business(99)], total: 1),
      );
      await pendingFirst;
      await Future<void>.delayed(Duration.zero);
      expect(
        container.read(mapBusinessesNotifierProvider).lastFetchBounds,
        isNull,
      );

      secondWave.complete(
        PaginatedBusinesses(items: [business(1)], total: 1),
      );
      await pendingSecond;
      await Future<void>.delayed(Duration.zero);
      expect(
        container.read(mapBusinessesNotifierProvider).lastFetchBounds,
        exitsNorth.padded(0.12),
      );
    });

    test('J — max-page incomplete fetch does not establish coverage', () async {
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          subcategoriesEnabledProvider.overrideWithValue(false),
          mapDiscoveryScopeProvider.overrideWith((ref) => null),
          catalogRepositoryProvider.overrideWith(
            (ref) => _MapPagingCatalogRepository(
              onFetch: ({required page, required limit}) async {
                final p = page;
                return PaginatedBusinesses(
                  items: List.generate(100, (i) => business(p * 1000 + i)),
                  total: 5000,
                );
              },
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      const visible = QalaGoMapBounds(
        southwest: QalaGoMapCoordinate(latitude: 51.10, longitude: 51.20),
        northeast: QalaGoMapCoordinate(latitude: 51.30, longitude: 51.50),
      );

      final notifier = container.read(mapBusinessesNotifierProvider.notifier);
      await notifier.onViewportIdle(visible);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(mapBusinessesNotifierProvider);
      expect(state.byLocationId.length, 3000);
      expect(state.lastFetchBounds, isNull);
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
      expect(state.byLocationId, isEmpty);
    });
  });
}

class _CountingThrowingCatalogRepository extends CatalogRepository {
  _CountingThrowingCatalogRepository({required this.onFetch}) : super(Dio());

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
