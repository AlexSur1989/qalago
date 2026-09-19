import 'package:maplibre_gl/maplibre_gl.dart';

/// maplibre_gl [MapLibreMapController.setLayerProperties] uses `skipNulls: false`,
/// which clears unspecified paint/layout keys. This sends only defined keys.
Future<void> qalagoSetLayerPropertiesSkipNulls(
  MapLibreMapController map,
  String layerId,
  Map<String, dynamic> properties,
) {
  final platform = (map as dynamic)._maplibrePlatform as MapLibrePlatform;
  return platform.setLayerProperties(layerId, properties);
}
