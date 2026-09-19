import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import 'qalago_map_house_numbers_policy.dart';
import 'qalago_map_style_mutation_sink.dart';

enum HouseNumbersInstallResult {
  installed,
  skippedMissingSource,
  skippedAlreadyPresent,
  failed,
}

class QalaGoMapHouseNumbersResult {
  const QalaGoMapHouseNumbersResult({
    required this.styleLoadGeneration,
    required this.installResult,
    required this.completed,
    this.skippedAlreadyApplied = false,
  });

  final int styleLoadGeneration;
  final HouseNumbersInstallResult installResult;
  final bool completed;
  final bool skippedAlreadyApplied;
}

/// Installs QalaGo-owned house-number labels from OpenMapTiles (C.6F.2).
class QalaGoMapHouseNumbers {
  QalaGoMapHouseNumbers({QalaGoMapStyleMutationSink? sinkForTesting})
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

  Future<QalaGoMapHouseNumbersResult> apply(MapLibreMapController map) async {
    final generation = _styleLoadGeneration;
    if (generation == 0) {
      if (kDebugMode) {
        debugPrint(
          '[QalaGoHouseNumbers] skip apply: call beginStyleLoad() first',
        );
      }
      return QalaGoMapHouseNumbersResult(
        styleLoadGeneration: generation,
        installResult: HouseNumbersInstallResult.failed,
        completed: false,
      );
    }
    if (_lastCompletedGeneration == generation) {
      return QalaGoMapHouseNumbersResult(
        styleLoadGeneration: generation,
        installResult: HouseNumbersInstallResult.skippedAlreadyPresent,
        completed: true,
        skippedAlreadyApplied: true,
      );
    }

    final sink = _sink(map);
    final layerId = QalaGoMapHouseNumbersPolicy.layerId;

    try {
      final sources = await sink.getSourceIds();
      if (!sources.contains(QalaGoMapHouseNumbersPolicy.vectorSourceId)) {
        if (kDebugMode) {
          debugPrint('[QalaGoHouseNumbers] skip: openmaptiles source missing');
        }
        return QalaGoMapHouseNumbersResult(
          styleLoadGeneration: generation,
          installResult: HouseNumbersInstallResult.skippedMissingSource,
          completed: true,
        );
      }
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoHouseNumbers] getSourceIds failed: $e');
        debugPrintStack(stackTrace: st);
      }
      return QalaGoMapHouseNumbersResult(
        styleLoadGeneration: generation,
        installResult: HouseNumbersInstallResult.failed,
        completed: false,
      );
    }

    try {
      await sink.removeLayer(layerId);
    } on PlatformException catch (e) {
      if (kDebugMode) {
        debugPrint('[QalaGoHouseNumbers] removeLayer (pre-install): ${e.code}');
      }
    } catch (_) {}

    try {
      await sink.addSymbolLayer(
        QalaGoMapHouseNumbersPolicy.vectorSourceId,
        layerId,
        SymbolLayerProperties(
          textField: QalaGoMapHouseNumbersPolicy.textFieldExpression(),
          textFont: QalaGoMapHouseNumbersPolicy.textFont(),
          textSize: QalaGoMapHouseNumbersPolicy.textSize,
          textColor: QalaGoMapHouseNumbersPolicy.textColor,
          textHaloColor: QalaGoMapHouseNumbersPolicy.textHaloColor,
          textHaloWidth: QalaGoMapHouseNumbersPolicy.textHaloWidth,
          textAllowOverlap: false,
          textIgnorePlacement: false,
          textOptional: true,
        ),
        sourceLayer: QalaGoMapHouseNumbersPolicy.sourceLayer,
        minzoom: QalaGoMapHouseNumbersPolicy.minZoom,
      );
      _lastCompletedGeneration = generation;
      if (kDebugMode) {
        debugPrint('[QalaGoHouseNumbers] installed $layerId');
      }
      return QalaGoMapHouseNumbersResult(
        styleLoadGeneration: generation,
        installResult: HouseNumbersInstallResult.installed,
        completed: true,
      );
    } on PlatformException catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoHouseNumbers] install failed: ${e.code} ${e.message}');
        debugPrintStack(stackTrace: st);
      }
      return QalaGoMapHouseNumbersResult(
        styleLoadGeneration: generation,
        installResult: HouseNumbersInstallResult.failed,
        completed: true,
      );
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[QalaGoHouseNumbers] install failed: $e');
        debugPrintStack(stackTrace: st);
      }
      return QalaGoMapHouseNumbersResult(
        styleLoadGeneration: generation,
        installResult: HouseNumbersInstallResult.failed,
        completed: true,
      );
    }
  }
}
