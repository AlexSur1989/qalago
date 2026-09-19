import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import 'qalago_map_light_style_paint_merge.dart';
import 'qalago_map_light_style_policy.dart';
import 'qalago_map_style_mutation_sink.dart';

enum LightStyleLayerResult {
  applied,
  skippedMissing,
  skippedUnknown,
  failed,
}

class QalaGoMapLightStyleResult {
  const QalaGoMapLightStyleResult({
    required this.styleLoadGeneration,
    required this.layerResults,
    required this.completed,
    this.skippedAlreadyApplied = false,
  });

  final int styleLoadGeneration;
  final Map<String, LightStyleLayerResult> layerResults;
  final bool completed;
  final bool skippedAlreadyApplied;

  int get appliedCount =>
      layerResults.values.where((r) => r == LightStyleLayerResult.applied).length;
}

/// QalaGo Light visual mutations on OpenFreeMap Liberty (C.6F.2).
class QalaGoMapLightStyle {
  QalaGoMapLightStyle({QalaGoMapStyleMutationSink? sinkForTesting})
      : _testSink = sinkForTesting;

  final QalaGoMapStyleMutationSink? _testSink;

  int _styleLoadGeneration = 0;
  int _lastCompletedGeneration = 0;

  @visibleForTesting
  int get styleLoadGeneration => _styleLoadGeneration;

  void beginStyleLoad() {
    _styleLoadGeneration++;
  }

  QalaGoMapStyleMutationSink _sink(MapLibreMapController map) {
    return _testSink ?? MapLibreQalaGoMapStyleMutationSink(map);
  }

  Future<QalaGoMapLightStyleResult> apply(MapLibreMapController map) async {
    final generation = _styleLoadGeneration;
    if (generation == 0) {
      if (kDebugMode) {
        debugPrint('[QalaGoLightStyle] skip apply: call beginStyleLoad() first');
      }
      return QalaGoMapLightStyleResult(
        styleLoadGeneration: generation,
        layerResults: const {},
        completed: false,
      );
    }
    if (_lastCompletedGeneration == generation) {
      return QalaGoMapLightStyleResult(
        styleLoadGeneration: generation,
        layerResults: const {},
        completed: true,
        skippedAlreadyApplied: true,
      );
    }

    final sink = _sink(map);
    final results = <String, LightStyleLayerResult>{};

    List<String> layerIds;
    try {
      layerIds = await sink.getLayerIds();
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoLightStyle] getLayerIds failed: $e');
        debugPrintStack(stackTrace: st);
      }
      return QalaGoMapLightStyleResult(
        styleLoadGeneration: generation,
        layerResults: results,
        completed: false,
      );
    }

    final idSet = layerIds.toSet();
    final targets = <String>{
      ...QalaGoMapLightStylePolicy.explicitTargetLayerIds,
      ...layerIds.where(QalaGoMapLightStylePolicy.isTransportationCasingLayer),
    };

    for (final layerId in targets) {
      if (!idSet.contains(layerId)) {
        results[layerId] = LightStyleLayerResult.skippedMissing;
        continue;
      }

      try {
        final applied = await _applyLayerMutation(sink, layerId);
        results[layerId] = applied
            ? LightStyleLayerResult.applied
            : LightStyleLayerResult.skippedUnknown;
        if (applied && kDebugMode) {
          debugPrint('[QalaGoLightStyle] styled $layerId');
        }
      } on PlatformException catch (e, st) {
        results[layerId] = LightStyleLayerResult.failed;
        if (kDebugMode) {
          debugPrint('[QalaGoLightStyle] $layerId failed: ${e.code} ${e.message}');
          debugPrintStack(stackTrace: st);
        }
      } catch (e, st) {
        results[layerId] = LightStyleLayerResult.failed;
        if (kDebugMode) {
          debugPrint('[QalaGoLightStyle] $layerId failed: $e');
          debugPrintStack(stackTrace: st);
        }
      }
    }

    final anyFailed = results.values.any((r) => r == LightStyleLayerResult.failed);
    if (!anyFailed) {
      _lastCompletedGeneration = generation;
    }

    return QalaGoMapLightStyleResult(
      styleLoadGeneration: generation,
      layerResults: results,
      completed: true,
    );
  }

  Future<bool> _applyLayerMutation(
    QalaGoMapStyleMutationSink sink,
    String layerId,
  ) async {
    final streetPaint = QalaGoMapLightStylePolicy.streetLabelPaintFor(layerId);
    if (streetPaint != null) {
      await sink.setLayerPropertyMap(layerId, streetPaint);
      return true;
    }

    if (QalaGoMapLightStylePolicy.buildingFillLayerIds.contains(layerId)) {
      final snapshot = await sink.getLayerProperties(layerId);
      final base = QalaGoMapLightStylePaintMerge.paintFromLayerSnapshot(snapshot);
      final paint = QalaGoMapLightStylePaintMerge.mergeFillPaint(
        basePaint: base,
        fillColor: QalaGoMapLightStylePolicy.buildingFillColor,
        fillOutlineColor: QalaGoMapLightStylePolicy.buildingOutlineColor,
      );
      await sink.setLayerPropertyMap(layerId, paint);
      return true;
    }

    if (QalaGoMapLightStylePolicy.buildingExtrusionLayerIds.contains(layerId)) {
      final snapshot = await sink.getLayerProperties(layerId);
      final paint = Map<String, dynamic>.from(
        QalaGoMapLightStylePaintMerge.paintFromLayerSnapshot(snapshot),
      );
      paint['fill-extrusion-color'] =
          QalaGoMapLightStylePolicy.buildingExtrusionColor;
      paint['fill-extrusion-opacity'] =
          QalaGoMapLightStylePolicy.buildingExtrusionOpacity;
      await sink.setLayerPropertyMap(layerId, paint);
      return true;
    }

    final lineColor = QalaGoMapLightStylePolicy.lineColorFor(layerId);
    if (lineColor != null) {
      final snapshot = await sink.getLayerProperties(layerId);
      final base = QalaGoMapLightStylePaintMerge.paintFromLayerSnapshot(snapshot);
      final paint = QalaGoMapLightStylePaintMerge.mergeLinePaint(
        basePaint: base,
        lineColor: lineColor,
        widthScale: QalaGoMapLightStylePolicy.lineWidthScaleFor(layerId),
      );
      if (QalaGoMapLightStylePolicy.boundaryLineLayerIds.contains(layerId)) {
        paint['line-opacity'] = 0.55;
      }
      await sink.setLayerPropertyMap(layerId, paint);
      return true;
    }

    final simple = QalaGoMapLightStylePolicy.simplePropertiesForLayer(layerId);
    if (simple != null) {
      await sink.setLayerProperties(layerId, simple);
      return true;
    }

    return false;
  }
}
