import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_ids.dart';
import 'package:qalago_mobile/core/map/qalago_map_business_layer_sink.dart';

/// Stateful sink that rejects duplicate native adds like MapLibre.
class QalaGoMapBusinessLayerTestSink implements QalaGoMapBusinessLayerSink {
  QalaGoMapBusinessLayerTestSink();

  final addSourceCalls = <GeojsonSourceProperties>[];
  final setGeoJsonCalls = <Map<String, dynamic>>[];
  final circleLayerIds = <String>[];
  final symbolLayerIds = <String>[];
  final layerAddAttempts = <String>[];
  final sourceAddAttempts = <String>[];

  var failNextAddSource = false;
  var failSymbolLayer = false;
  var failRemoveLayer = false;
  var failRemoveSource = false;
  var duplicateAddThrows = true;

  final _sources = <String>{};
  final _layers = <String>{};

  @override
  Future<void> addSource(String sourceId, GeojsonSourceProperties properties) {
    sourceAddAttempts.add(sourceId);
    if (failNextAddSource) {
      throw PlatformException(code: 'STYLE_NOT_READY', message: 'test');
    }
    if (_sources.contains(sourceId)) {
      if (duplicateAddThrows) {
        throw PlatformException(
          code: 'CannotAddSourceException',
          message: 'Source $sourceId already exists',
        );
      }
      return Future.value();
    }
    _sources.add(sourceId);
    addSourceCalls.add(properties);
    return Future.value();
  }

  @override
  Future<void> setGeoJsonSource(
    String sourceId,
    Map<String, dynamic> featureCollection,
  ) {
    setGeoJsonCalls.add(featureCollection);
    return Future.value();
  }

  @override
  Future<void> addCircleLayer(
    String sourceId,
    String layerId,
    CircleLayerProperties properties, {
    List<Object>? filter,
  }) {
    layerAddAttempts.add(layerId);
    if (_layers.contains(layerId)) {
      if (duplicateAddThrows) {
        throw PlatformException(
          code: 'CannotAddLayerException',
          message: 'Layer $layerId already exists',
        );
      }
      return Future.value();
    }
    _layers.add(layerId);
    circleLayerIds.add(layerId);
    return Future.value();
  }

  @override
  Future<void> addSymbolLayer(
    String sourceId,
    String layerId,
    SymbolLayerProperties properties, {
    List<Object>? filter,
  }) {
    layerAddAttempts.add(layerId);
    if (failSymbolLayer) {
      throw PlatformException(code: 'LAYER', message: 'symbol fail');
    }
    if (_layers.contains(layerId)) {
      if (duplicateAddThrows) {
        throw PlatformException(
          code: 'CannotAddLayerException',
          message: 'Layer $layerId already exists',
        );
      }
      return Future.value();
    }
    _layers.add(layerId);
    symbolLayerIds.add(layerId);
    return Future.value();
  }

  @override
  Future<void> removeLayer(String layerId) {
    if (failRemoveLayer) {
      throw PlatformException(code: 'removeLayer', message: 'failed');
    }
    _layers.remove(layerId);
    circleLayerIds.remove(layerId);
    symbolLayerIds.remove(layerId);
    return Future.value();
  }

  @override
  Future<void> removeSource(String sourceId) {
    if (failRemoveSource) {
      throw PlatformException(code: 'removeSource', message: 'failed');
    }
    _sources.remove(sourceId);
    return Future.value();
  }

  @override
  Future<List<String>> getLayerIds() async => _layers.toList(growable: false);

  @override
  Future<List<String>> getSourceIds() async => _sources.toList(growable: false);

  int countLayerAdds(String layerId) =>
      layerAddAttempts.where((id) => id == layerId).length;

  bool get hasBusinessSource =>
      _sources.contains(QalaGoMapBusinessLayerIds.source);
}
