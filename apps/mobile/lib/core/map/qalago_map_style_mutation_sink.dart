import 'package:flutter/services.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import 'qalago_maplibre_layer_properties_merge.dart';

/// Runtime style I/O for QalaGo Light + house numbers (C.6F.2).
abstract class QalaGoMapStyleMutationSink {
  Future<List<String>> getLayerIds();

  Future<List<String>> getSourceIds();

  Future<Map<String, dynamic>?> getLayerProperties(String layerId);

  Future<void> setLayerProperties(String layerId, LayerProperties properties);

  /// Style-spec paint keys only (safe partial updates with skipNulls).
  Future<void> setLayerPropertyMap(String layerId, Map<String, dynamic> properties);

  Future<void> addSymbolLayer(
    String sourceId,
    String layerId,
    SymbolLayerProperties properties, {
    String? belowLayerId,
    String? sourceLayer,
    double? minzoom,
    double? maxzoom,
    dynamic filter,
  });

  Future<void> removeLayer(String layerId);
}

class MapLibreQalaGoMapStyleMutationSink implements QalaGoMapStyleMutationSink {
  MapLibreQalaGoMapStyleMutationSink(this._map);

  final MapLibreMapController _map;

  @override
  Future<List<String>> getLayerIds() async {
    final ids = await _map.getLayerIds();
    return ids.whereType<String>().toList(growable: false);
  }

  @override
  Future<List<String>> getSourceIds() async {
    return _map.getSourceIds();
  }

  @override
  Future<Map<String, dynamic>?> getLayerProperties(String layerId) {
    return _map.getLayerProperties(layerId);
  }

  Future<LayerProperties> _mergedLayerProperties(
    String layerId,
    Map<String, dynamic> overrides,
  ) async {
    final snapshot = await _map.getLayerProperties(layerId);
    if (snapshot == null) {
      throw PlatformException(
        code: 'LAYER_NOT_FOUND',
        message: 'Layer $layerId not found in current style',
      );
    }
    return qalagoLayerPropertiesWithPropertyOverrides(
      layerSnapshot: snapshot,
      propertyOverrides: overrides,
    );
  }

  @override
  Future<void> setLayerProperties(String layerId, LayerProperties properties) {
    if (properties is SymbolLayerProperties) {
      throw ArgumentError(
        'SymbolLayerProperties must not use setLayerProperties (clears layout)',
      );
    }
    return _applyMergedProperties(
      layerId,
      properties.toJson(skipNulls: true),
    );
  }

  @override
  Future<void> setLayerPropertyMap(
    String layerId,
    Map<String, dynamic> properties,
  ) {
    return _applyMergedProperties(layerId, properties);
  }

  Future<void> _applyMergedProperties(
    String layerId,
    Map<String, dynamic> overrides,
  ) async {
    final merged = await _mergedLayerProperties(layerId, overrides);
    await _map.setLayerProperties(layerId, merged);
  }

  @override
  Future<void> addSymbolLayer(
    String sourceId,
    String layerId,
    SymbolLayerProperties properties, {
    String? belowLayerId,
    String? sourceLayer,
    double? minzoom,
    double? maxzoom,
    dynamic filter,
  }) {
    return _map.addSymbolLayer(
      sourceId,
      layerId,
      properties,
      belowLayerId: belowLayerId,
      sourceLayer: sourceLayer,
      minzoom: minzoom,
      maxzoom: maxzoom,
      filter: filter,
    );
  }

  @override
  Future<void> removeLayer(String layerId) {
    return _map.removeLayer(layerId);
  }
}
