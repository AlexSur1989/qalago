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
import '../../shared/models/models.dart';

const kMapBusinessPageSize = 100;
const kMapBusinessMaxPagesPerFetch = 30;

/// Fixed map business state for widget/integration tests.
MapBusinessesState mapBusinessesStateForTest({
  required List<BusinessModel> items,
  int? catalogTotal,
  Object? error,
  bool loading = false,
}) {
  return MapBusinessesState(
    byId: {for (final b in items) b.id: b},
    catalogTotal: catalogTotal ?? items.length,
    error: error,
    loading: loading,
  );
}

class MapBusinessesState {
  const MapBusinessesState({
    this.byId = const {},
    this.catalogTotal = 0,
    this.loading = false,
    this.error,
    this.scopeGeneration = 0,
    this.lastFetchBounds,
    this.visibleBounds,
  });

  final Map<String, BusinessModel> byId;
  final int catalogTotal;
  final bool loading;
  final Object? error;
  final int scopeGeneration;
  final QalaGoMapBounds? lastFetchBounds;
  final QalaGoMapBounds? visibleBounds;

  int get total => byId.length;

  List<BusinessModel> get items {
    final all = businessesWithValidMapCoordinates(byId.values.toList());
    final viewport = visibleBounds;
    if (viewport == null) return all;
    return all
        .where(
          (b) => viewport.contains(
            QalaGoMapCoordinate(
              latitude: b.latitude!,
              longitude: b.longitude!,
            ),
          ),
        )
        .toList();
  }

  MapBusinessesState copyWith({
    Map<String, BusinessModel>? byId,
    int? catalogTotal,
    bool? loading,
    Object? error,
    bool clearError = false,
    int? scopeGeneration,
    QalaGoMapBounds? lastFetchBounds,
    QalaGoMapBounds? visibleBounds,
  }) {
    return MapBusinessesState(
      byId: byId ?? this.byId,
      catalogTotal: catalogTotal ?? this.catalogTotal,
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
    state = state.copyWith(visibleBounds: bounds);
    if (!mapBoundsFetchNeeded(previous: state.lastFetchBounds, next: bounds)) {
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
    final merged = Map<String, BusinessModel>.from(state.byId);
    var catalogTotal = 0;

    try {
      for (var page = 1; page <= kMapBusinessMaxPagesPerFetch; page++) {
        if (cancelToken.isCancelled ||
            scopeGeneration != state.scopeGeneration ||
            requestGeneration != _requestGeneration) {
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

        catalogTotal = pageResult.total;
        for (final business in businessesWithValidMapCoordinates(pageResult.items)) {
          merged[business.id] = business;
        }

        if (pageResult.items.isEmpty ||
            page * kMapBusinessPageSize >= pageResult.total) {
          break;
        }
      }

      if (scopeGeneration != state.scopeGeneration ||
          requestGeneration != _requestGeneration) {
        return;
      }

      state = state.copyWith(
        byId: merged,
        catalogTotal: catalogTotal,
        loading: false,
        lastFetchBounds: bounds,
        clearError: true,
      );
    } catch (e, _) {
      if (cancelToken.isCancelled ||
          scopeGeneration != state.scopeGeneration ||
          requestGeneration != _requestGeneration) {
        return;
      }
      state = state.copyWith(loading: false, error: e);
    }
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
