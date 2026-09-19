import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import 'qalago_map_basemap_hardening_sink.dart';
import 'qalago_map_commercial_poi_policy.dart';

/// Per-style-load commercial POI suppression on OpenFreeMap Liberty (C.6F.1).
class QalaGoMapBasemapHardening {
  QalaGoMapBasemapHardening({QalaGoMapBasemapHardeningSink? sinkForTesting})
      : _testSink = sinkForTesting;

  final QalaGoMapBasemapHardeningSink? _testSink;

  int _styleLoadGeneration = 0;
  int _lastCompletedGeneration = 0;

  @visibleForTesting
  int get styleLoadGeneration => _styleLoadGeneration;

  @visibleForTesting
  int get lastCompletedGeneration => _lastCompletedGeneration;

  /// Call once when MapLibre reports a new style load (before [apply]).
  void beginStyleLoad() {
    _styleLoadGeneration++;
  }

  QalaGoMapBasemapHardeningSink _sink(MapLibreMapController map) {
    return _testSink ?? MapLibreQalaGoMapBasemapHardeningSink(map);
  }

  /// Runs once per style load. Idempotent per generation; safe to call again
  /// after a new style load (generation increments).
  Future<BasemapHardeningResult> apply(MapLibreMapController map) async {
    final generation = _styleLoadGeneration;
    if (generation == 0) {
      if (kDebugMode) {
        debugPrint(
          '[QalaGoBasemapHardening] skip apply: call beginStyleLoad() first',
        );
      }
      return BasemapHardeningResult(
        styleLoadGeneration: generation,
        layerResults: const {},
        completed: false,
      );
    }
    if (_lastCompletedGeneration == generation) {
      return BasemapHardeningResult(
        styleLoadGeneration: generation,
        layerResults: const {},
        completed: true,
        skippedAlreadyHardened: true,
      );
    }

    final sink = _sink(map);
    final layerResults = <String, BasemapLayerHardeningResult>{};

    List<String> layerIds;
    try {
      layerIds = await sink.getLayerIds();
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoBasemapHardening] getLayerIds failed: $e');
        debugPrintStack(stackTrace: st);
      }
      return BasemapHardeningResult(
        styleLoadGeneration: generation,
        layerResults: layerResults,
        completed: false,
      );
    }

    final idSet = layerIds.toSet();

    for (final layerId
        in QalaGoMapCommercialPoiPolicy.libertyMixedPoiLayerIds) {
      if (!idSet.contains(layerId)) {
        layerResults[layerId] = BasemapLayerHardeningResult.skippedMissing;
        if (kDebugMode) {
          debugPrint('[QalaGoBasemapHardening] skip missing layer $layerId');
        }
        continue;
      }

      try {
        Object? existing;
        try {
          existing = await sink.getFilter(layerId);
        } catch (_) {
          existing = QalaGoMapCommercialPoiPolicy.libertyBaseFilters[layerId];
        }

        if (existing == null) {
          existing = QalaGoMapCommercialPoiPolicy.libertyBaseFilters[layerId];
        }

        final merged =
            QalaGoMapCommercialPoiPolicy.mergeFilterWithCommercialSuppression(
          existing,
        );
        await sink.setFilter(layerId, merged);
        layerResults[layerId] = BasemapLayerHardeningResult.applied;
        if (kDebugMode) {
          debugPrint('[QalaGoBasemapHardening] hardened $layerId');
        }
      } on PlatformException catch (e, st) {
        layerResults[layerId] = BasemapLayerHardeningResult.failed;
        if (kDebugMode) {
          debugPrint(
            '[QalaGoBasemapHardening] $layerId failed: ${e.code} ${e.message}',
          );
          debugPrintStack(stackTrace: st);
        }
      } catch (e, st) {
        layerResults[layerId] = BasemapLayerHardeningResult.failed;
        if (kDebugMode) {
          debugPrint('[QalaGoBasemapHardening] $layerId failed: $e');
          debugPrintStack(stackTrace: st);
        }
      }
    }

    final anyFailed = layerResults.values.any(
      (r) => r == BasemapLayerHardeningResult.failed,
    );
    if (!anyFailed) {
      _lastCompletedGeneration = generation;
    }
    return BasemapHardeningResult(
      styleLoadGeneration: generation,
      layerResults: layerResults,
      completed: true,
    );
  }
}

enum BasemapLayerHardeningResult {
  applied,
  skippedMissing,
  failed,
}

class BasemapHardeningResult {
  const BasemapHardeningResult({
    required this.styleLoadGeneration,
    required this.layerResults,
    required this.completed,
    this.skippedAlreadyHardened = false,
  });

  final int styleLoadGeneration;
  final Map<String, BasemapLayerHardeningResult> layerResults;
  final bool completed;
  final bool skippedAlreadyHardened;

  bool layerApplied(String layerId) =>
      layerResults[layerId] == BasemapLayerHardeningResult.applied;
}
