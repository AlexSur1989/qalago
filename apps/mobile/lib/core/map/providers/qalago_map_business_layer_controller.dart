import 'package:maplibre_gl/maplibre_gl.dart';

import '../business_map_category_colors.dart';
import '../qalago_map_business_cluster_config.dart';
import '../qalago_map_business_layer_ids.dart';
import '../qalago_map_business_layer_style.dart';
import '../qalago_native_map_business_layer_config.dart';

/// MapLibre GeoJSON source + layers for catalog businesses (C.6B–C.6D).
class QalaGoMapBusinessLayerController {
  bool _sourceInstalled = false;
  bool _layersInstalled = false;
  bool? _installedClusterMode;

  bool get sourceInstalled => _sourceInstalled;

  Future<void> onStyleLoaded(MapLibreMapController map) async {
    if (!QalaGoNativeMapBusinessLayerConfig.enabled) {
      return;
    }
    await _tearDownSourceAndLayers(map);
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

  Future<void> _tearDownSourceAndLayers(MapLibreMapController map) async {
    for (final layerId in QalaGoMapBusinessLayerStyle.allManagedLayerIds()) {
      try {
        await map.removeLayer(layerId);
      } catch (_) {}
    }
    try {
      await map.removeSource(QalaGoMapBusinessLayerIds.source);
    } catch (_) {}
    _sourceInstalled = false;
    _layersInstalled = false;
    _installedClusterMode = null;
  }

  Future<void> _ensureClusterMode(MapLibreMapController map) async {
    final wantCluster = QalaGoMapBusinessClusterConfig.enabledOnSource;
    if (_sourceInstalled && _installedClusterMode != wantCluster) {
      await _tearDownSourceAndLayers(map);
    }
  }

  Future<void> ensureSource(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
  ) async {
    if (!QalaGoNativeMapBusinessLayerConfig.enabled) {
      return;
    }

    await _ensureClusterMode(map);

    if (!_sourceInstalled) {
      try {
        await map.addSource(
          QalaGoMapBusinessLayerIds.source,
          _sourceProperties(featureCollection),
        );
        _sourceInstalled = true;
        _installedClusterMode = QalaGoMapBusinessClusterConfig.enabledOnSource;
        return;
      } catch (_) {
        _sourceInstalled = true;
        _installedClusterMode = QalaGoMapBusinessClusterConfig.enabledOnSource;
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
      if (QalaGoMapBusinessClusterConfig.enabledOnSource) {
        await map.addCircleLayer(
          QalaGoMapBusinessLayerIds.source,
          QalaGoMapBusinessLayerIds.clusterCircles,
          CircleLayerProperties(
            circleColor: QalaGoMapBusinessLayerStyle.clusterFillColor,
            circleOpacity: 0.88,
            circleStrokeWidth: 2,
            circleStrokeColor: QalaGoMapBusinessLayerStyle.clusterStrokeColor,
            circleRadius: QalaGoMapBusinessLayerStyle.clusterCircleRadiusExpression(),
          ),
          filter: QalaGoMapBusinessLayerStyle.clusterFeatureFilter(),
        );

        await map.addSymbolLayer(
          QalaGoMapBusinessLayerIds.source,
          QalaGoMapBusinessLayerIds.clusterCount,
          SymbolLayerProperties(
            textField: QalaGoMapBusinessLayerStyle.clusterCountTextExpression(),
            textSize: 13,
            textColor: '#FFFFFF',
            textAllowOverlap: true,
            textIgnorePlacement: true,
          ),
          filter: QalaGoMapBusinessLayerStyle.clusterFeatureFilter(),
        );
      }

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
      // Fresh style reload is the common case; ignore duplicate layer races.
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
    _installedClusterMode = null;
  }

  static Map<String, dynamic> emptyFeatureCollection() => {
        'type': 'FeatureCollection',
        'features': <Map<String, dynamic>>[],
      };
}
