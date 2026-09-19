import 'package:maplibre_gl/maplibre_gl.dart';

import '../qalago_map_business_cluster_config.dart';
import '../qalago_map_business_layer_ids.dart';
import '../qalago_native_map_business_layer_config.dart';

/// MapLibre GeoJSON source lifecycle for catalog businesses (C.6B foundation).
///
/// Selection uses GeoJSON `selected` 0/1 property (not feature-state) for
/// cross-platform parity. Visible selection styling arrives in C.6E.
class QalaGoMapBusinessLayerController {
  bool _sourceInstalled = false;

  bool get sourceInstalled => _sourceInstalled;

  /// Call when the map style finishes loading (or reloads).
  Future<void> onStyleLoaded(MapLibreMapController map) async {
    if (!QalaGoNativeMapBusinessLayerConfig.enabled) {
      return;
    }
    _sourceInstalled = false;
    await ensureSource(map, emptyFeatureCollection());
    await ensureLayers(map);
  }

  /// Idempotent source install + clustered GeoJSON configuration.
  Future<void> ensureSource(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
  ) async {
    if (!QalaGoNativeMapBusinessLayerConfig.enabled) {
      return;
    }

    if (!_sourceInstalled) {
      try {
        await map.addSource(
          QalaGoMapBusinessLayerIds.source,
          GeojsonSourceProperties(
            data: featureCollection,
            cluster: true,
            clusterRadius: QalaGoMapBusinessClusterConfig.clusterRadius,
            clusterMaxZoom: QalaGoMapBusinessClusterConfig.clusterMaxZoom,
            clusterMinPoints: QalaGoMapBusinessClusterConfig.clusterMinPoints,
          ),
        );
        _sourceInstalled = true;
        return;
      } catch (_) {
        // Source may already exist after style reload; fall through to update.
        _sourceInstalled = true;
      }
    }

    await map.setGeoJsonSource(
      QalaGoMapBusinessLayerIds.source,
      featureCollection,
    );
  }

  /// Layer install hook for C.6C/D. No visible layers in C.6B.
  Future<void> ensureLayers(MapLibreMapController map) async {
    if (!QalaGoNativeMapBusinessLayerConfig.enabled) {
      return;
    }
    // C.6C: unclustered Symbol/CircleLayer using [QalaGoMapBusinessLayerIds].
    // C.6D: cluster circle + count layers.
  }

  /// Push catalog businesses when map state changes (not on camera frames).
  Future<void> syncBusinessGeoJson(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
  ) async {
    if (!QalaGoNativeMapBusinessLayerConfig.enabled) {
      return;
    }
    if (!_sourceInstalled) {
      await ensureSource(map, featureCollection);
      await ensureLayers(map);
      return;
    }
    await map.setGeoJsonSource(
      QalaGoMapBusinessLayerIds.source,
      featureCollection,
    );
  }

  void dispose() {
    _sourceInstalled = false;
  }

  static Map<String, dynamic> emptyFeatureCollection() => {
        'type': 'FeatureCollection',
        'features': <Map<String, dynamic>>[],
      };

}
