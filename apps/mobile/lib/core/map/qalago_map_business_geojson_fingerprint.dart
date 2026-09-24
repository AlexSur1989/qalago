/// Deterministic semantic identity for native business map GeoJSON (MAP-PERF.C3.2).
abstract final class QalaGoMapBusinessGeoJsonFingerprint {
  static const empty = 'fc:0';

  static String fromFeatureCollection(Map<String, dynamic> featureCollection) {
    final features = featureCollection['features'];
    if (features is! List || features.isEmpty) {
      return empty;
    }
    return fromFeatureMaps(
      features.whereType<Map<String, dynamic>>().toList(growable: false),
    );
  }

  static String fromFeatureMaps(List<Map<String, dynamic>> features) {
    if (features.isEmpty) {
      return empty;
    }
    final segments = features.map(_featureSegment).toList()..sort();
    return 'fc:${segments.length}:${segments.join(';')}';
  }

  static String _featureSegment(Map<String, dynamic> feature) {
    final id = feature['id']?.toString() ?? '';
    final geometry = feature['geometry'];
    var lng = '';
    var lat = '';
    if (geometry is Map) {
      final coords = geometry['coordinates'];
      if (coords is List && coords.length >= 2) {
        lng = coords[0].toString();
        lat = coords[1].toString();
      }
    }
    final props = feature['properties'];
    if (props is! Map) {
      return '$id@$lng,$lat';
    }
    final businessId = props['businessId']?.toString() ?? '';
    final locationId = props['locationId']?.toString() ?? '';
    final categoryId = props['categoryId']?.toString() ?? '';
    final categoryKey = props['categoryKey']?.toString() ?? '';
    final selected = props['selected']?.toString() ?? '0';
    return '$locationId|$businessId|$lng,$lat|$categoryId|$categoryKey|s$selected';
  }
}
