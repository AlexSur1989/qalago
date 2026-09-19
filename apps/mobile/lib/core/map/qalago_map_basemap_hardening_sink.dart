import 'package:maplibre_gl/maplibre_gl.dart';

/// Style mutation I/O for basemap hardening (testable).
abstract class QalaGoMapBasemapHardeningSink {
  Future<List<String>> getLayerIds();

  Future<Object?> getFilter(String layerId);

  Future<void> setFilter(String layerId, Object filter);
}

class MapLibreQalaGoMapBasemapHardeningSink
    implements QalaGoMapBasemapHardeningSink {
  MapLibreQalaGoMapBasemapHardeningSink(this._map);

  final MapLibreMapController _map;

  @override
  Future<List<String>> getLayerIds() async {
    final ids = await _map.getLayerIds();
    return ids.whereType<String>().toList(growable: false);
  }

  @override
  Future<Object?> getFilter(String layerId) {
    return _map.getFilter(layerId);
  }

  @override
  Future<void> setFilter(String layerId, Object filter) {
    return _map.setFilter(layerId, filter);
  }
}
