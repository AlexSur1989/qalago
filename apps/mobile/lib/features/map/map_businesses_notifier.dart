import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/map/qalago_map_bounds.dart';
import '../../core/map/qalago_map_coordinate.dart';
import '../../core/providers/city_provider.dart';
import '../../core/release/app_config_provider.dart';
import '../auth/providers/auth_provider.dart' show catalogRepositoryProvider;
import '../catalog/data/catalog_repository.dart';
import 'map_bounds_utils.dart';
import 'map_coordinate_validity.dart';
import 'map_discovery_scope.dart';
import 'map_physical_key.dart';
import '../../core/map/map_viewport_debug_log.dart';
import '../../shared/models/models.dart';

const kMapBusinessPageSize = 100;
const kMapBusinessMaxPagesPerFetch = 30;

/// Fixed map business state for widget/integration tests.
MapBusinessesState mapBusinessesStateForTest({
  required List<BusinessModel> items,
  int? viewportTotal,
  Object? error,
  bool loading = false,
}) {
  return MapBusinessesState(
    byLocationId: {for (final b in items) mapPhysicalKey(b): b},
    viewportTotal: viewportTotal ?? items.length,
    error: error,
    loading: loading,
  );
}

class MapBusinessesState {
  const MapBusinessesState({
    this.byLocationId = const {},
    this.viewportTotal = 0,
    this.loading = false,
    this.error,
    this.scopeGeneration = 0,
    this.lastFetchBounds,
    this.visibleBounds,
  });

  /// Map rows keyed by physical marker identity ([mapPhysicalKey]).
  final Map<String, BusinessModel> byLocationId;

  /// PostGIS total for the last padded **viewport** fetch (not city-wide).
  final int viewportTotal;
  final bool loading;
  final Object? error;
  final int scopeGeneration;
  final QalaGoMapBounds? lastFetchBounds;
  final QalaGoMapBounds? visibleBounds;

  int get total => byLocationId.length;

  List<BusinessModel> get items {
    return _filterByBounds(visibleBounds);
  }

  /// Rows rendered on the map layer (native GeoJSON / overlay pins).
  ///
  /// Uses [lastFetchBounds] (padded viewport used for API fetch) so branches
  /// returned by the server are not hidden by the tighter [visibleBounds].
  List<BusinessModel> get mapLayerItems {
    return _filterByBounds(lastFetchBounds ?? visibleBounds);
  }

  List<BusinessModel> _filterByBounds(QalaGoMapBounds? bounds) {
    final all = businessesWithValidMapCoordinates(byLocationId.values.toList());
    if (bounds == null) return all;
    return all
        .where(
          (b) => bounds.contains(
            QalaGoMapCoordinate(
              latitude: b.latitude!,
              longitude: b.longitude!,
            ),
          ),
        )
        .toList();
  }

  MapBusinessesState copyWith({
    Map<String, BusinessModel>? byLocationId,
    int? viewportTotal,
    bool? loading,
    Object? error,
    bool clearError = false,
    int? scopeGeneration,
    QalaGoMapBounds? lastFetchBounds,
    QalaGoMapBounds? visibleBounds,
  }) {
    return MapBusinessesState(
      byLocationId: byLocationId ?? this.byLocationId,
      viewportTotal: viewportTotal ?? this.viewportTotal,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
      scopeGeneration: scopeGeneration ?? this.scopeGeneration,
      lastFetchBounds: lastFetchBounds ?? this.lastFetchBounds,
      visibleBounds: visibleBounds ?? this.visibleBounds,
    );
  }
}

class MapBusinessesNotifier extends Notifier<MapBusinessesState> {
  CancelToken? _cancelToken;
  int _requestGeneration = 0;

  @override
  MapBusinessesState build() {
    ref.listen(cityProvider, (previous, next) {
      if (previous?.slug != next.slug) {
        resetForScopeChange();
      }
    });
    ref.listen(mapDiscoveryScopeProvider, (previous, next) {
      if (previous != next) {
        resetForScopeChange(clearSelectionExternally: false);
      }
    });
    return const MapBusinessesState();
  }

  void resetForScopeChange({bool clearSelectionExternally = true}) {
    _cancelToken?.cancel();
    _requestGeneration++;
    state = MapBusinessesState(
      scopeGeneration: state.scopeGeneration + 1,
    );
  }

  Future<void> onViewportIdle(QalaGoMapBounds bounds) async {
    final previousVisibleBounds = state.visibleBounds;
    mapViewportDbg(
      'MAPDBG onViewportIdle received=${mapViewportDbgBounds(bounds)}',
    );
    mapViewportDbg(
      'MAPDBG previousVisibleBounds=${mapViewportDbgBounds(previousVisibleBounds)}',
    );
    mapViewportDbg(
      'MAPDBG lastFetchBounds=${mapViewportDbgBounds(state.lastFetchBounds)}',
    );
    state = state.copyWith(visibleBounds: bounds);
    final fetchNeeded = mapBoundsFetchNeeded(
      previous: state.lastFetchBounds,
      next: bounds,
    );
    mapViewportDbg('MAPDBG fetchNeeded=$fetchNeeded');
    if (!fetchNeeded) {
      mapViewportDbg('MAPDBG fetchSkipped');
      return;
    }
    await _fetchForBounds(bounds.padded(0.12));
  }

  Future<void> retry() async {
    final bounds = state.visibleBounds ?? state.lastFetchBounds;
    if (bounds == null) return;
    await _fetchForBounds(bounds.padded(0.12));
  }

  Future<void> _fetchForBounds(QalaGoMapBounds bounds) async {
    final scopeGeneration = state.scopeGeneration;
    final requestGeneration = ++_requestGeneration;
    _cancelToken?.cancel();
    final cancelToken = CancelToken();
    _cancelToken = cancelToken;

    state = state.copyWith(loading: true, clearError: true);

    final city = ref.read(cityProvider);
    final enabled = ref.read(subcategoriesEnabledProvider);
    final scope = ref.read(mapDiscoveryScopeProvider);
    final params = resolveMapBusinessesFetchParams(
      subcategoriesEnabled: enabled,
      scope: scope,
      citySlug: city.slug,
    );

    final catalog = ref.read(catalogRepositoryProvider);
    final merged = Map<String, BusinessModel>.from(state.byLocationId);
    var viewportTotal = 0;
    var itemsReceivedFromApi = 0;

    mapViewportDbg('MAPDBG fetch START');
    mapViewportDbg('MAPDBG fetchBounds=${mapViewportDbgBounds(bounds)}');
    mapViewportDbg('MAPDBG fetchGeneration=$requestGeneration');

    try {
      for (var page = 1; page <= kMapBusinessMaxPagesPerFetch; page++) {
        if (cancelToken.isCancelled ||
            scopeGeneration != state.scopeGeneration ||
            requestGeneration != _requestGeneration) {
          mapViewportDbg('MAPDBG fetch DROPPED_STALE');
          return;
        }

        final pageResult = await catalog.fetchBusinesses(
          citySlug: params.citySlug,
          categoryId: params.categoryId,
          subcategoryId: params.subcategoryId,
          forMap: true,
          minLat: bounds.minLat,
          maxLat: bounds.maxLat,
          minLng: bounds.minLng,
          maxLng: bounds.maxLng,
          page: page,
          limit: kMapBusinessPageSize,
          cancelToken: cancelToken,
        );

        viewportTotal = pageResult.total;
        itemsReceivedFromApi += pageResult.items.length;
        for (final business in businessesWithValidMapCoordinates(pageResult.items)) {
          merged[mapPhysicalKey(business)] = business;
        }

        if (pageResult.items.isEmpty ||
            itemsReceivedFromApi >= pageResult.total) {
          break;
        }
      }

      if (scopeGeneration != state.scopeGeneration ||
          requestGeneration != _requestGeneration) {
        mapViewportDbg('MAPDBG fetch DROPPED_STALE');
        return;
      }

      state = state.copyWith(
        byLocationId: merged,
        viewportTotal: viewportTotal,
        loading: false,
        lastFetchBounds: bounds,
        clearError: true,
      );
      final sampleIds = merged.keys.take(5).join(',');
      mapViewportDbg('MAPDBG fetch SUCCESS count=${merged.length}');
      mapViewportDbg('MAPDBG fetch returnedLocationIds=$sampleIds');
      _logMapBusinessStateSnapshot('MAPDBG state');
    } catch (e, _) {
      if (cancelToken.isCancelled ||
          scopeGeneration != state.scopeGeneration ||
          requestGeneration != _requestGeneration) {
        mapViewportDbg('MAPDBG fetch DROPPED_STALE');
        return;
      }
      mapViewportDbg('MAPDBG fetch ERROR=$e');
      state = state.copyWith(loading: false, error: e);
    }
  }

  void _logMapBusinessStateSnapshot(String prefix) {
    final s = state;
    mapViewportDbg(
      '$prefix visibleBounds=${mapViewportDbgBounds(s.visibleBounds)}',
    );
    mapViewportDbg(
      '$prefix lastFetchBounds=${mapViewportDbgBounds(s.lastFetchBounds)}',
    );
    mapViewportDbg('$prefix cacheCount=${s.byLocationId.length}');
    mapViewportDbg('$prefix visibleBusinessCount=${s.items.length}');
    mapViewportDbg('$prefix mapLayerCount=${s.mapLayerItems.length}');
  }
}

final mapBusinessesNotifierProvider =
    NotifierProvider<MapBusinessesNotifier, MapBusinessesState>(
  MapBusinessesNotifier.new,
);

/// Legacy read surface for map UI/tests.
final mapBusinessesProvider = Provider<MapBusinessesState>(
  (ref) => ref.watch(mapBusinessesNotifierProvider),
);
