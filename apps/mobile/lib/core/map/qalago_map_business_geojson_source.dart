import 'package:maplibre_gl/maplibre_gl.dart';

import 'qalago_map_business_cluster_config.dart';

/// GeoJSON source options for the native business layer (maplibre_gl 0.27.1).
///
/// Android [SourcePropertyConverter] reads `cluster`, `clusterMaxZoom`, and
/// `clusterRadius` as numbers converted via [Convert.toInt]. `clusterMinPoints`
/// is supported but omitted here so the native default (2) applies — same as our
/// [QalaGoMapBusinessClusterConfig.clusterMinPoints] tuning constant.
abstract final class QalaGoMapBusinessGeoJsonSource {
  static int featureCount(Map<String, dynamic> featureCollection) {
    final features = featureCollection['features'];
    if (features is! List) {
      return 0;
    }
    return features.length;
  }

  /// When clustering is on, defer creating the source until we have features so
  /// the clustered source is born with real data (not empty → setGeoJson only).
  static bool shouldDeferSourceInstall({
    required bool clusterEnabled,
    required int featureCount,
  }) {
    return clusterEnabled && featureCount == 0;
  }

  static GeojsonSourceProperties propertiesFor(
    Map<String, dynamic> featureCollection,
  ) {
    if (QalaGoMapBusinessClusterConfig.enabledOnSource) {
      return GeojsonSourceProperties(
        data: featureCollection,
        cluster: true,
        clusterRadius: QalaGoMapBusinessClusterConfig.clusterRadius,
        clusterMaxZoom: QalaGoMapBusinessClusterConfig.clusterMaxZoom,
      );
    }
    return GeojsonSourceProperties(
      data: featureCollection,
      cluster: false,
    );
  }

  /// JSON payload sent to `style#addSource` (for tests / serialization audit).
  static Map<String, dynamic> propertiesJsonFor(
    Map<String, dynamic> featureCollection,
  ) {
    return propertiesFor(featureCollection).toJson();
  }
}
