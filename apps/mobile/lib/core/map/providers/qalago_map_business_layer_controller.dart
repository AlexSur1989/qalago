import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../business_map_category_colors.dart';
import '../qalago_map_business_cluster_config.dart';
import '../qalago_map_business_geojson_source.dart';
import '../qalago_map_business_layer_ids.dart';
import '../qalago_map_business_layer_sink.dart';
import '../qalago_map_business_layer_style.dart';
import '../qalago_native_map_business_layer_config.dart';

/// MapLibre GeoJSON source + layers for catalog businesses (C.6B–C.6D).
class QalaGoMapBusinessLayerController {
  QalaGoMapBusinessLayerController({QalaGoMapBusinessLayerSink? sinkForTesting})
      : _testSink = sinkForTesting;

  final QalaGoMapBusinessLayerSink? _testSink;

  /// Unit tests set this when [QalaGoNativeMapBusinessLayerConfig.enabled] is false.
  @visibleForTesting
  bool debugForceNativeLayerEnabled = false;

  bool get _nativeLayerEnabled =>
      debugForceNativeLayerEnabled ||
      QalaGoNativeMapBusinessLayerConfig.enabled;

  bool _sourceInstalled = false;
  bool _layersInstalled = false;
  bool _clusterCirclesInstalled = false;
  bool _clusterCountInstalled = false;
  bool _unclusteredInstalled = false;
  bool _selectedInstalled = false;
  bool? _installedClusterMode;
  Map<String, dynamic>? _latestFeatureCollection;

  bool get sourceInstalled => _sourceInstalled;

  @visibleForTesting
  bool get layersInstalled => _layersInstalled;

  @visibleForTesting
  Map<String, dynamic>? get latestFeatureCollection => _latestFeatureCollection;

  QalaGoMapBusinessLayerSink _sink(MapLibreMapController map) {
    return _testSink ?? MapLibreQalaGoMapBusinessLayerSink(map);
  }

  Future<void> onStyleLoaded(MapLibreMapController map) async {
    if (!_nativeLayerEnabled) {
      return;
    }
    await _tearDownSourceAndLayers(map);
    final pending =
        _latestFeatureCollection ?? emptyFeatureCollection();
    await _installSourceAndLayersIfReady(map, pending);
  }

  Future<void> _tearDownSourceAndLayers(MapLibreMapController map) async {
    final sink = _sink(map);
    for (final layerId in QalaGoMapBusinessLayerStyle.allManagedLayerIds()) {
      try {
        await sink.removeLayer(layerId);
      } on PlatformException catch (e) {
        if (kDebugMode) {
          debugPrint(
            '[QalaGoMapBusinessLayer] removeLayer $layerId: ${e.code}',
          );
        }
      } catch (_) {}
    }
    try {
      await sink.removeSource(QalaGoMapBusinessLayerIds.source);
    } on PlatformException catch (e) {
      if (kDebugMode) {
        debugPrint(
          '[QalaGoMapBusinessLayer] removeSource: ${e.code}',
        );
      }
    } catch (_) {}
    _sourceInstalled = false;
    _layersInstalled = false;
    _clusterCirclesInstalled = false;
    _clusterCountInstalled = false;
    _unclusteredInstalled = false;
    _selectedInstalled = false;
    _installedClusterMode = null;
  }

  void _recomputeLayersInstalled() {
    _layersInstalled = computeLayersInstalledFlag(
      clusterEnabled: QalaGoMapBusinessClusterConfig.enabledOnSource,
      clusterCirclesOk: _clusterCirclesInstalled,
      clusterCountOk: _clusterCountInstalled,
      unclusteredOk: _unclusteredInstalled,
      selectedOk: _selectedInstalled,
    );
  }

  Future<void> _ensureClusterMode(MapLibreMapController map) async {
    final wantCluster = QalaGoMapBusinessClusterConfig.enabledOnSource;
    if (_sourceInstalled && _installedClusterMode != wantCluster) {
      await _tearDownSourceAndLayers(map);
    }
  }

  Future<void> _installSourceAndLayersIfReady(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
  ) async {
    if (QalaGoMapBusinessGeoJsonSource.shouldDeferSourceInstall(
      clusterEnabled: QalaGoMapBusinessClusterConfig.enabledOnSource,
      featureCount: QalaGoMapBusinessGeoJsonSource.featureCount(featureCollection),
    )) {
      return;
    }
    await _ensureClusterMode(map);
    if (!_sourceInstalled) {
      final added = await _addSource(map, featureCollection);
      if (!added) {
        return;
      }
    }
    await ensureLayers(map);
    if (_sourceInstalled) {
      await _applyGeoJsonIfNeeded(map, featureCollection);
    }
  }

  Future<bool> _addSource(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
  ) async {
    if (_sourceInstalled) {
      return true;
    }
    final sink = _sink(map);
    try {
      await sink.addSource(
        QalaGoMapBusinessLayerIds.source,
        QalaGoMapBusinessGeoJsonSource.propertiesFor(featureCollection),
      );
      _sourceInstalled = true;
      _installedClusterMode = QalaGoMapBusinessClusterConfig.enabledOnSource;
      return true;
    } on PlatformException catch (e, st) {
      if (kDebugMode) {
        debugPrint(
          '[QalaGoMapBusinessLayer] addSource failed: ${e.code} ${e.message}',
        );
        debugPrintStack(stackTrace: st);
      }
      _sourceInstalled = false;
      _installedClusterMode = null;
      return false;
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoMapBusinessLayer] addSource failed: $e');
        debugPrintStack(stackTrace: st);
      }
      _sourceInstalled = false;
      _installedClusterMode = null;
      return false;
    }
  }

  Future<void> _applyGeoJsonIfNeeded(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
  ) async {
    if (!_sourceInstalled) {
      return;
    }
    final sink = _sink(map);
    try {
      await sink.setGeoJsonSource(
        QalaGoMapBusinessLayerIds.source,
        featureCollection,
      );
    } on PlatformException catch (e, st) {
      if (kDebugMode) {
        debugPrint(
          '[QalaGoMapBusinessLayer] setGeoJsonSource failed: ${e.code}',
        );
        debugPrintStack(stackTrace: st);
      }
      rethrow;
    }
  }

  Future<void> ensureLayers(MapLibreMapController map) async {
    if (!_nativeLayerEnabled) {
      return;
    }
    if (!_sourceInstalled) {
      return;
    }
    if (_layersInstalled) {
      return;
    }

    final sink = _sink(map);

    if (QalaGoMapBusinessClusterConfig.enabledOnSource &&
        !_clusterCirclesInstalled) {
      try {
        await sink.addCircleLayer(
          QalaGoMapBusinessLayerIds.source,
          QalaGoMapBusinessLayerIds.clusterCircles,
          CircleLayerProperties(
            circleColor: QalaGoMapBusinessLayerStyle.clusterFillColor,
            circleOpacity: QalaGoMapBusinessLayerStyle.fix1ClusterCircleOpacity,
            circleStrokeWidth: QalaGoMapBusinessLayerStyle.fix1ClusterStrokeWidth,
            circleStrokeColor: QalaGoMapBusinessLayerStyle.clusterStrokeColor,
            circleRadius: QalaGoMapBusinessLayerStyle.fix1ClusterCircleRadius,
          ),
          filter: QalaGoMapBusinessLayerStyle.clusterFeatureFilter(),
        );
        _clusterCirclesInstalled = true;
      } on PlatformException catch (e, st) {
        if (kDebugMode) {
          debugPrint(
            '[QalaGoMapBusinessLayer] cluster circles: ${e.code}',
          );
          debugPrintStack(stackTrace: st);
        }
      } catch (e, st) {
        if (kDebugMode) {
          debugPrint('[QalaGoMapBusinessLayer] cluster circles: $e');
          debugPrintStack(stackTrace: st);
        }
      }
    }

    if (QalaGoMapBusinessClusterConfig.enabledOnSource &&
        !_clusterCountInstalled) {
      try {
        await sink.addSymbolLayer(
          QalaGoMapBusinessLayerIds.source,
          QalaGoMapBusinessLayerIds.clusterCount,
          SymbolLayerProperties(
            textField: QalaGoMapBusinessLayerStyle.fix1ClusterCountTextField(),
            textFont: QalaGoMapBusinessLayerStyle.fix1ClusterCountTextFont(),
            textSize: 13,
            textColor: '#FFFFFF',
            textAllowOverlap: true,
            textIgnorePlacement: true,
          ),
          filter: QalaGoMapBusinessLayerStyle.clusterFeatureFilter(),
        );
        _clusterCountInstalled = true;
      } on PlatformException catch (e, st) {
        if (kDebugMode) {
          debugPrint(
            '[QalaGoMapBusinessLayer] cluster count: ${e.code}',
          );
          debugPrintStack(stackTrace: st);
        }
      } catch (e, st) {
        if (kDebugMode) {
          debugPrint('[QalaGoMapBusinessLayer] cluster count: $e');
          debugPrintStack(stackTrace: st);
        }
      }
    }

    if (!_unclusteredInstalled) {
      try {
      await sink.addCircleLayer(
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
      _unclusteredInstalled = true;
    } on PlatformException catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoMapBusinessLayer] unclustered: ${e.code}');
        debugPrintStack(stackTrace: st);
      }
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoMapBusinessLayer] unclustered: $e');
        debugPrintStack(stackTrace: st);
      }
    }
    }

    if (!_selectedInstalled) {
      try {
      await sink.addCircleLayer(
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
      _selectedInstalled = true;
    } on PlatformException catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoMapBusinessLayer] selected: ${e.code}');
        debugPrintStack(stackTrace: st);
      }
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoMapBusinessLayer] selected: $e');
        debugPrintStack(stackTrace: st);
      }
    }
    }

    _recomputeLayersInstalled();
  }

  Future<void> syncBusinessGeoJson(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
  ) async {
    if (!_nativeLayerEnabled) {
      return;
    }
    _latestFeatureCollection = featureCollection;

    if (QalaGoMapBusinessGeoJsonSource.shouldDeferSourceInstall(
      clusterEnabled: QalaGoMapBusinessClusterConfig.enabledOnSource,
      featureCount: QalaGoMapBusinessGeoJsonSource.featureCount(featureCollection),
    )) {
      if (!_sourceInstalled) {
        return;
      }
    }

    await _ensureClusterMode(map);

    if (!_sourceInstalled) {
      await _installSourceAndLayersIfReady(map, featureCollection);
      return;
    }

    await _applyGeoJsonIfNeeded(map, featureCollection);

    if (!_layersInstalled) {
      await ensureLayers(map);
    }
  }

  void dispose() {
    _sourceInstalled = false;
    _layersInstalled = false;
    _clusterCirclesInstalled = false;
    _clusterCountInstalled = false;
    _unclusteredInstalled = false;
    _selectedInstalled = false;
    _installedClusterMode = null;
    _latestFeatureCollection = null;
  }

  static Map<String, dynamic> emptyFeatureCollection() => {
        'type': 'FeatureCollection',
        'features': <Map<String, dynamic>>[],
      };

  /// Whether all required native layers reported installed (for tests).
  @visibleForTesting
  static bool computeLayersInstalledFlag({
    required bool clusterEnabled,
    required bool clusterCirclesOk,
    required bool clusterCountOk,
    required bool unclusteredOk,
    required bool selectedOk,
  }) {
    if (!unclusteredOk || !selectedOk) {
      return false;
    }
    if (!clusterEnabled) {
      return true;
    }
    return clusterCirclesOk && clusterCountOk;
  }
}
