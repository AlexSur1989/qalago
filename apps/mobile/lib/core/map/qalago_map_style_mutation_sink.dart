import 'package:maplibre_gl/maplibre_gl.dart';

/// Runtime style I/O for QalaGo Light + house numbers (C.6F.2).
abstract class QalaGoMapStyleMutationSink {
  Future<List<String>> getLayerIds();

  Future<List<String>> getSourceIds();

  Future<void> setLayerProperties(String layerId, LayerProperties properties);

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
  Future<void> setLayerProperties(String layerId, LayerProperties properties) {
    if (properties is SymbolLayerProperties) {
      throw ArgumentError(
        'SymbolLayerProperties must not use setLayerProperties (clears layout)',
      );
    }
    return _map.setLayerProperties(layerId, properties);
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
