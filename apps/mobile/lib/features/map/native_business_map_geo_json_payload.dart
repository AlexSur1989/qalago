import '../../core/map/qalago_map_business_geojson_fingerprint.dart';

/// MapLibre native business layer payload + semantic fingerprint (MAP-PERF.C3.2).
class NativeBusinessMapGeoJsonPayload {
  const NativeBusinessMapGeoJsonPayload({
    required this.featureCollection,
    required this.contentFingerprint,
  });

  final Map<String, dynamic> featureCollection;
  final String contentFingerprint;

  static NativeBusinessMapGeoJsonPayload empty() => NativeBusinessMapGeoJsonPayload(
        featureCollection: const {
          'type': 'FeatureCollection',
          'features': <Map<String, dynamic>>[],
        },
        contentFingerprint: QalaGoMapBusinessGeoJsonFingerprint.empty,
      );
}
