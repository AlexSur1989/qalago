import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../business_map_category_colors.dart';
import '../map_viewport_debug_log.dart';
import '../qalago_map_business_cluster_config.dart';
import '../qalago_map_business_geojson_source.dart';
import '../qalago_map_business_layer_ids.dart';
import '../qalago_map_business_layer_platform_errors.dart';
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

  bool _disposed = false;
  int _styleEpoch = 0;
  Future<void> _operationChain = Future<void>.value();

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
  int get styleEpoch => _styleEpoch;

  @visibleForTesting
  Map<String, dynamic>? get latestFeatureCollection => _latestFeatureCollection;

  QalaGoMapBusinessLayerSink _sink(MapLibreMapController map) {
    return _testSink ?? MapLibreQalaGoMapBusinessLayerSink(map);
  }

  Future<void> onStyleLoaded(MapLibreMapController map) {
    if (!_nativeLayerEnabled || _disposed) {
      return Future<void>.value();
    }
    return _enqueue(() async {
      _styleEpoch++;
      final epoch = _styleEpoch;
      mapViewportDbg('MAPDBG businessLayer styleEpoch=$epoch start');
      _resetInstallFlags();
      await _tearDownSourceAndLayers(map, epoch);
      if (!_isEpochActive(epoch)) {
        mapViewportDbg('MAPDBG businessLayer styleEpoch=$epoch stale after tearDown');
        return;
      }
      await _reconcileInstallFlagsFromNative(map, epoch);
      final pending =
          _latestFeatureCollection ?? emptyFeatureCollection();
      await _installSourceAndLayersIfReady(map, pending, epoch);
      if (_isEpochActive(epoch)) {
        mapViewportDbg('MAPDBG businessLayer styleEpoch=$epoch ready');
      }
    });
  }

  Future<void> syncBusinessGeoJson(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
  ) {
    if (!_nativeLayerEnabled || _disposed) {
      return Future<void>.value();
    }
    _latestFeatureCollection = featureCollection;
    return _enqueue(() async {
      final epoch = _styleEpoch;
      await _syncBusinessGeoJsonForEpoch(map, featureCollection, epoch);
    });
  }

  Future<void> ensureLayers(MapLibreMapController map) {
    if (!_nativeLayerEnabled || _disposed) {
      return Future<void>.value();
    }
    return _enqueue(() async {
      await _ensureLayersForEpoch(map, _styleEpoch);
    });
  }

  Future<void> _enqueue(Future<void> Function() action) {
    final run = _operationChain.then((_) async {
      if (_disposed) {
        return;
      }
      await action();
    });
    _operationChain = run.catchError((Object _, StackTrace __) {});
    return run;
  }

  bool _isEpochActive(int epoch) => !_disposed && epoch == _styleEpoch;

  void _resetInstallFlags() {
    _sourceInstalled = false;
    _layersInstalled = false;
    _clusterCirclesInstalled = false;
    _clusterCountInstalled = false;
    _unclusteredInstalled = false;
    _selectedInstalled = false;
    _installedClusterMode = null;
  }

  Future<void> _syncBusinessGeoJsonForEpoch(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
    int epoch,
  ) async {
    if (!_isEpochActive(epoch)) {
      mapViewportDbg('MAPDBG businessLayer sync ignored stale epoch=$epoch');
      return;
    }

    if (QalaGoMapBusinessGeoJsonSource.shouldDeferSourceInstall(
      clusterEnabled: QalaGoMapBusinessClusterConfig.enabledOnSource,
      featureCount: QalaGoMapBusinessGeoJsonSource.featureCount(featureCollection),
    )) {
      if (!_sourceInstalled) {
        return;
      }
    }

    await _ensureClusterMode(map, epoch);
    if (!_isEpochActive(epoch)) {
      return;
    }

    if (!_sourceInstalled) {
      await _installSourceAndLayersIfReady(map, featureCollection, epoch);
      return;
    }

    await _applyGeoJsonIfNeeded(map, featureCollection, epoch);
    if (!_isEpochActive(epoch)) {
      return;
    }

    if (!_layersInstalled) {
      await _ensureLayersForEpoch(map, epoch);
    }
  }

  Future<void> _tearDownSourceAndLayers(
    MapLibreMapController map,
    int epoch,
  ) async {
    if (!_isEpochActive(epoch)) {
      return;
    }
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
  }

  Future<void> _reconcileInstallFlagsFromNative(
    MapLibreMapController map,
    int epoch,
  ) async {
    if (!_isEpochActive(epoch)) {
      return;
    }
    final sink = _sink(map);
    List<String> layerIds;
    List<String> sourceIds;
    try {
      layerIds = await sink.getLayerIds();
      sourceIds = await sink.getSourceIds();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[QalaGoMapBusinessLayer] reconcile query failed: $e');
      }
      return;
    }
    if (!_isEpochActive(epoch)) {
      return;
    }

    final layerSet = layerIds.toSet();
    if (sourceIds.contains(QalaGoMapBusinessLayerIds.source)) {
      _sourceInstalled = true;
      _installedClusterMode = QalaGoMapBusinessClusterConfig.enabledOnSource;
      mapViewportDbg('MAPDBG businessLayer reconcile source=present');
    }
    if (layerSet.contains(QalaGoMapBusinessLayerIds.clusterCircles)) {
      _clusterCirclesInstalled = true;
    }
    if (layerSet.contains(QalaGoMapBusinessLayerIds.clusterCount)) {
      _clusterCountInstalled = true;
    }
    if (layerSet.contains(QalaGoMapBusinessLayerIds.unclustered)) {
      _unclusteredInstalled = true;
    }
    if (layerSet.contains(QalaGoMapBusinessLayerIds.selected)) {
      _selectedInstalled = true;
    }
    _recomputeLayersInstalled();
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

  Future<void> _ensureClusterMode(MapLibreMapController map, int epoch) async {
    final wantCluster = QalaGoMapBusinessClusterConfig.enabledOnSource;
    if (_sourceInstalled && _installedClusterMode != wantCluster) {
      _resetInstallFlags();
      await _tearDownSourceAndLayers(map, epoch);
      await _reconcileInstallFlagsFromNative(map, epoch);
    }
  }

  Future<void> _installSourceAndLayersIfReady(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
    int epoch,
  ) async {
    if (!_isEpochActive(epoch)) {
      return;
    }
    if (QalaGoMapBusinessGeoJsonSource.shouldDeferSourceInstall(
      clusterEnabled: QalaGoMapBusinessClusterConfig.enabledOnSource,
      featureCount: QalaGoMapBusinessGeoJsonSource.featureCount(featureCollection),
    )) {
      return;
    }
    await _ensureClusterMode(map, epoch);
    if (!_isEpochActive(epoch)) {
      return;
    }
    if (!_sourceInstalled) {
      final added = await _addSource(map, featureCollection, epoch);
      if (!added || !_isEpochActive(epoch)) {
        return;
      }
    }
    await _ensureLayersForEpoch(map, epoch);
    if (!_isEpochActive(epoch)) {
      return;
    }
    if (_sourceInstalled) {
      await _applyGeoJsonIfNeeded(map, featureCollection, epoch);
    }
  }

  Future<bool> _addSource(
    MapLibreMapController map,
    Map<String, dynamic> featureCollection,
    int epoch,
  ) async {
    if (!_isEpochActive(epoch)) {
      return false;
    }
    if (_sourceInstalled) {
      return true;
    }
    final sink = _sink(map);
    try {
      final sourceIds = await sink.getSourceIds();
      if (!_isEpochActive(epoch)) {
        return false;
      }
      if (sourceIds.contains(QalaGoMapBusinessLayerIds.source)) {
        _sourceInstalled = true;
        _installedClusterMode = QalaGoMapBusinessClusterConfig.enabledOnSource;
        mapViewportDbg('MAPDBG businessLayer reconcile source=skipAdd');
        return true;
      }
    } catch (_) {
      // Proceed with add attempt.
    }

    try {
      await sink.addSource(
        QalaGoMapBusinessLayerIds.source,
        QalaGoMapBusinessGeoJsonSource.propertiesFor(featureCollection),
      );
      if (!_isEpochActive(epoch)) {
        return false;
      }
      _sourceInstalled = true;
      _installedClusterMode = QalaGoMapBusinessClusterConfig.enabledOnSource;
      mapViewportDbg('MAPDBG businessLayer source installed');
      return true;
    } on PlatformException catch (e, st) {
      if (QalaGoMapBusinessLayerPlatformErrors.isAlreadyExists(e)) {
        if (_isEpochActive(epoch)) {
          _sourceInstalled = true;
          _installedClusterMode = QalaGoMapBusinessClusterConfig.enabledOnSource;
          mapViewportDbg('MAPDBG businessLayer source reconciled alreadyExists');
        }
        return _isEpochActive(epoch);
      }
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
    int epoch,
  ) async {
    if (!_isEpochActive(epoch) || !_sourceInstalled) {
      return;
    }
    final sink = _sink(map);
    try {
      await sink.setGeoJsonSource(
        QalaGoMapBusinessLayerIds.source,
        featureCollection,
      );
      if (_isEpochActive(epoch)) {
        mapViewportDbg(
          'MAPDBG businessLayer geojson applied features=${QalaGoMapBusinessGeoJsonSource.featureCount(featureCollection)}',
        );
      }
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

  Future<void> _ensureLayersForEpoch(MapLibreMapController map, int epoch) async {
    if (!_isEpochActive(epoch) || !_sourceInstalled) {
      return;
    }
    if (_layersInstalled) {
      return;
    }

    final sink = _sink(map);
    Set<String> nativeLayers = {};
    try {
      nativeLayers = (await sink.getLayerIds()).toSet();
    } catch (_) {}

    if (QalaGoMapBusinessClusterConfig.enabledOnSource &&
        !_clusterCirclesInstalled) {
      await _addCircleLayerTracked(
        map: map,
        epoch: epoch,
        sink: sink,
        nativeLayers: nativeLayers,
        layerId: QalaGoMapBusinessLayerIds.clusterCircles,
        onInstalled: () => _clusterCirclesInstalled = true,
        properties: CircleLayerProperties(
          circleColor: QalaGoMapBusinessLayerStyle.clusterFillColor,
          circleOpacity: QalaGoMapBusinessLayerStyle.fix1ClusterCircleOpacity,
          circleStrokeWidth: QalaGoMapBusinessLayerStyle.fix1ClusterStrokeWidth,
          circleStrokeColor: QalaGoMapBusinessLayerStyle.clusterStrokeColor,
          circleRadius: QalaGoMapBusinessLayerStyle.fix1ClusterCircleRadius,
        ),
        filter: QalaGoMapBusinessLayerStyle.clusterFeatureFilter(),
        logLabel: 'cluster circles',
      );
    }

    if (QalaGoMapBusinessClusterConfig.enabledOnSource &&
        !_clusterCountInstalled) {
      await _addSymbolLayerTracked(
        map: map,
        epoch: epoch,
        sink: sink,
        nativeLayers: nativeLayers,
        layerId: QalaGoMapBusinessLayerIds.clusterCount,
        onInstalled: () => _clusterCountInstalled = true,
        properties: SymbolLayerProperties(
          textField: QalaGoMapBusinessLayerStyle.fix1ClusterCountTextField(),
          textFont: QalaGoMapBusinessLayerStyle.fix1ClusterCountTextFont(),
          textSize: 13,
          textColor: '#FFFFFF',
          textAllowOverlap: true,
          textIgnorePlacement: true,
        ),
        filter: QalaGoMapBusinessLayerStyle.clusterFeatureFilter(),
        logLabel: 'cluster count',
      );
    }

    if (!_unclusteredInstalled) {
      await _addCircleLayerTracked(
        map: map,
        epoch: epoch,
        sink: sink,
        nativeLayers: nativeLayers,
        layerId: QalaGoMapBusinessLayerIds.unclustered,
        onInstalled: () => _unclusteredInstalled = true,
        properties: CircleLayerProperties(
          circleRadius: QalaGoMapBusinessLayerStyle.normalCircleRadius,
          circleColor: BusinessMapCategoryColors.circleColorExpression(),
          circleOpacity: 0.92,
          circleStrokeWidth: 1.5,
          circleStrokeColor: '#FFFFFF',
          circleStrokeOpacity: 0.9,
        ),
        filter: QalaGoMapBusinessLayerStyle.normalBusinessFilter(),
        logLabel: 'unclustered',
      );
    }

    if (!_selectedInstalled) {
      await _addCircleLayerTracked(
        map: map,
        epoch: epoch,
        sink: sink,
        nativeLayers: nativeLayers,
        layerId: QalaGoMapBusinessLayerIds.selected,
        onInstalled: () => _selectedInstalled = true,
        properties: CircleLayerProperties(
          circleRadius: QalaGoMapBusinessLayerStyle.selectedCircleRadius,
          circleColor: BusinessMapCategoryColors.circleColorExpression(),
          circleOpacity: 1,
          circleStrokeWidth: QalaGoMapBusinessLayerStyle.selectedStrokeWidth,
          circleStrokeColor: QalaGoMapBusinessLayerStyle.selectedStrokeColor,
          circleStrokeOpacity: 1,
        ),
        filter: QalaGoMapBusinessLayerStyle.selectedBusinessFilter(),
        logLabel: 'selected',
      );
    }

    if (_isEpochActive(epoch)) {
      _recomputeLayersInstalled();
    }
  }

  Future<void> _addCircleLayerTracked({
    required MapLibreMapController map,
    required int epoch,
    required QalaGoMapBusinessLayerSink sink,
    required Set<String> nativeLayers,
    required String layerId,
    required void Function() onInstalled,
    required CircleLayerProperties properties,
    required List<Object> filter,
    required String logLabel,
  }) async {
    if (!_isEpochActive(epoch)) {
      return;
    }
    if (nativeLayers.contains(layerId)) {
      onInstalled();
      mapViewportDbg('MAPDBG businessLayer reconcile layer=$layerId present');
      return;
    }
    try {
      await sink.addCircleLayer(
        QalaGoMapBusinessLayerIds.source,
        layerId,
        properties,
        filter: filter,
      );
      if (_isEpochActive(epoch)) {
        onInstalled();
        mapViewportDbg('MAPDBG businessLayer layer=$layerId installed');
      }
    } on PlatformException catch (e, st) {
      if (QalaGoMapBusinessLayerPlatformErrors.isAlreadyExists(e)) {
        if (_isEpochActive(epoch)) {
          onInstalled();
          mapViewportDbg(
            'MAPDBG businessLayer layer=$layerId reconciled alreadyExists',
          );
        }
        return;
      }
      if (kDebugMode) {
        debugPrint('[QalaGoMapBusinessLayer] $logLabel: ${e.code}');
        debugPrintStack(stackTrace: st);
      }
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoMapBusinessLayer] $logLabel: $e');
        debugPrintStack(stackTrace: st);
      }
    }
  }

  Future<void> _addSymbolLayerTracked({
    required MapLibreMapController map,
    required int epoch,
    required QalaGoMapBusinessLayerSink sink,
    required Set<String> nativeLayers,
    required String layerId,
    required void Function() onInstalled,
    required SymbolLayerProperties properties,
    required List<Object> filter,
    required String logLabel,
  }) async {
    if (!_isEpochActive(epoch)) {
      return;
    }
    if (nativeLayers.contains(layerId)) {
      onInstalled();
      mapViewportDbg('MAPDBG businessLayer reconcile layer=$layerId present');
      return;
    }
    try {
      await sink.addSymbolLayer(
        QalaGoMapBusinessLayerIds.source,
        layerId,
        properties,
        filter: filter,
      );
      if (_isEpochActive(epoch)) {
        onInstalled();
        mapViewportDbg('MAPDBG businessLayer layer=$layerId installed');
      }
    } on PlatformException catch (e, st) {
      if (QalaGoMapBusinessLayerPlatformErrors.isAlreadyExists(e)) {
        if (_isEpochActive(epoch)) {
          onInstalled();
          mapViewportDbg(
            'MAPDBG businessLayer layer=$layerId reconciled alreadyExists',
          );
        }
        return;
      }
      if (kDebugMode) {
        debugPrint('[QalaGoMapBusinessLayer] $logLabel: ${e.code}');
        debugPrintStack(stackTrace: st);
      }
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoMapBusinessLayer] $logLabel: $e');
        debugPrintStack(stackTrace: st);
      }
    }
  }

  void dispose() {
    _disposed = true;
    _styleEpoch++;
    _resetInstallFlags();
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
