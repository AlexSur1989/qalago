import 'package:maplibre_gl/maplibre_gl.dart';

import '../business_map_category_colors.dart';
import '../qalago_map_business_cluster_config.dart';
import '../qalago_map_business_layer_ids.dart';
import '../qalago_map_business_layer_style.dart';
import '../qalago_native_map_business_layer_config.dart';

/// MapLibre GeoJSON source + circle layers for catalog businesses (C.6B/C.6C).
///
/// Selection uses GeoJSON `selected` 0/1 (not feature-state). C.6D enables
/// [QalaGoMapBusinessClusterConfig.enabledOnSource] and recreates the source.
class QalaGoMapBusinessLayerController {
  bool _sourceInstalled = false;
  bool _layersInstalled = false;

  bool get sourceInstalled => _sourceInstalled;

  /// Call when the map style finishes loading (or reloads).
  Future<void> onStyleLoaded(MapLibreMapController map) async {
    if (!QalaGoNativeMapBusinessLayerConfig.enabled) {
      return;
    }
    _sourceInstalled = false;
    _layersInstalled = false;
    await ensureSource(map, emptyFeatureCollection());
    await ensureLayers(map);
  }

  GeojsonSourceProperties _sourceProperties(Map<String, dynamic> data) {
    if (QalaGoMapBusinessClusterConfig.enabledOnSource) {
      return GeojsonSourceProperties(
        data: data,
        cluster: true,
        clusterRadius: QalaGoMapBusinessClusterConfig.clusterRadius,
        clusterMaxZoom: QalaGoMapBusinessClusterConfig.clusterMaxZoom,
        clusterMinPoints: QalaGoMapBusinessClusterConfig.clusterMinPoints,
      );
    }
    return GeojsonSourceProperties(
      data: data,
      cluster: false,
    );
  }

  /// Idempotent source install. C.6C uses `cluster: false`.
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
          _sourceProperties(featureCollection),
        );
        _sourceInstalled = true;
        return;
      } catch (_) {
        _sourceInstalled = true;
      }
    }

    await map.setGeoJsonSource(
      QalaGoMapBusinessLayerIds.source,
      featureCollection,
    );
  }

  Future<void> ensureLayers(MapLibreMapController map) async {
    if (!QalaGoNativeMapBusinessLayerConfig.enabled || _layersInstalled) {
      return;
    }

    try {
      await map.addCircleLayer(
        QalaGoMapBusinessLayerIds.source,
        QalaGoMapBusinessLayerIds.unclustered,
        CircleLayerProperties(
          circleRadius: QalaGoMapBusinessLayerStyle.normalCircleRadius,
          circleColor: BusinessMapCategoryColors.circleColorExpression(),
          circleOpacity: 0.92,
          circleStrokeWidth: 1.5,
          circleStrokeColor: '#FFFFFF',
          circleStrokeOpacity: 0.9,
        ),
        filter: QalaGoMapBusinessLayerStyle.normalBusinessFilter(),
      );

      await map.addCircleLayer(
        QalaGoMapBusinessLayerIds.source,
        QalaGoMapBusinessLayerIds.selected,
        CircleLayerProperties(
          circleRadius: QalaGoMapBusinessLayerStyle.selectedCircleRadius,
          circleColor: BusinessMapCategoryColors.circleColorExpression(),
          circleOpacity: 1,
          circleStrokeWidth: QalaGoMapBusinessLayerStyle.selectedStrokeWidth,
          circleStrokeColor: QalaGoMapBusinessLayerStyle.selectedStrokeColor,
          circleStrokeOpacity: 1,
        ),
        filter: QalaGoMapBusinessLayerStyle.selectedBusinessFilter(),
      );
    } catch (_) {
      // Style reload may race; layers are idempotent by id on fresh styles.
    }
    _layersInstalled = true;
  }

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
    _layersInstalled = false;
  }

  static Map<String, dynamic> emptyFeatureCollection() => {
        'type': 'FeatureCollection',
        'features': <Map<String, dynamic>>[],
      };
}
