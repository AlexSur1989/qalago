import 'package:maplibre_gl/maplibre_gl.dart';

/// Indirection over [MapLibreMapController] for testable layer/source I/O.
abstract class QalaGoMapBusinessLayerSink {
  Future<void> addSource(String sourceId, GeojsonSourceProperties properties);

  Future<void> setGeoJsonSource(
    String sourceId,
    Map<String, dynamic> featureCollection,
  );

  Future<void> addCircleLayer(
    String sourceId,
    String layerId,
    CircleLayerProperties properties, {
    List<Object>? filter,
  });

  Future<void> addSymbolLayer(
    String sourceId,
    String layerId,
    SymbolLayerProperties properties, {
    List<Object>? filter,
  });

  Future<void> removeLayer(String layerId);

  Future<void> removeSource(String sourceId);
}

class MapLibreQalaGoMapBusinessLayerSink implements QalaGoMapBusinessLayerSink {
  MapLibreQalaGoMapBusinessLayerSink(this._map);

  final MapLibreMapController _map;

  @override
  Future<void> addSource(String sourceId, GeojsonSourceProperties properties) {
    return _map.addSource(sourceId, properties);
  }

  @override
  Future<void> setGeoJsonSource(
    String sourceId,
    Map<String, dynamic> featureCollection,
  ) {
    return _map.setGeoJsonSource(sourceId, featureCollection);
  }

  @override
  Future<void> addCircleLayer(
    String sourceId,
    String layerId,
    CircleLayerProperties properties, {
    List<Object>? filter,
  }) {
    return _map.addCircleLayer(
      sourceId,
      layerId,
      properties,
      filter: filter,
    );
  }

  @override
  Future<void> addSymbolLayer(
    String sourceId,
    String layerId,
    SymbolLayerProperties properties, {
    List<Object>? filter,
  }) {
    return _map.addSymbolLayer(
      sourceId,
      layerId,
      properties,
      filter: filter,
    );
  }

  @override
  Future<void> removeLayer(String layerId) {
    return _map.removeLayer(layerId);
  }

  @override
  Future<void> removeSource(String sourceId) {
    return _map.removeSource(sourceId);
  }
}
