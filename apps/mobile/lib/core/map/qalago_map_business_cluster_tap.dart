import 'package:maplibre_gl/maplibre_gl.dart';

import 'qalago_map_business_layer_ids.dart';
import 'qalago_map_business_layer_style.dart';

/// Parsed cluster tap target for MapLibre expansion (C.6D).
class QalaGoMapClusterTapTarget {
  const QalaGoMapClusterTapTarget({
    required this.clusterId,
    required this.center,
  });

  final int clusterId;
  final LatLng center;
}

/// Decodes cluster taps and computes expansion zoom (C.6D).
abstract final class QalaGoMapBusinessClusterTap {
  static const fallbackZoomIncrement = 1.5;
  static const maxMapZoom = 18.0;

  static bool isClusterLayerId(String? layerId) {
    return QalaGoMapBusinessLayerStyle.isClusterLayerId(layerId);
  }

  /// Parses cluster metadata from a queried/tapped feature map.
  static QalaGoMapClusterTapTarget? parseClusterFeature(
    dynamic rawFeature, {
    LatLng? tapCoordinates,
  }) {
    final feature = _asFeatureMap(rawFeature);
    if (feature == null) {
      return null;
    }

    final properties = feature['properties'];
    if (properties is! Map) {
      return null;
    }

    if (!properties.containsKey('point_count')) {
      return null;
    }

    final clusterId = _parseClusterId(properties['cluster_id']);
    if (clusterId == null) {
      return null;
    }

    final center = _coordinatesFromFeature(feature) ?? tapCoordinates;
    if (center == null) {
      return null;
    }

    return QalaGoMapClusterTapTarget(clusterId: clusterId, center: center);
  }

  static int? _parseClusterId(Object? raw) {
    if (raw is int) {
      return raw;
    }
    if (raw is num) {
      return raw.toInt();
    }
    if (raw is String) {
      return int.tryParse(raw);
    }
    return null;
  }

  static Map<String, dynamic>? _asFeatureMap(dynamic raw) {
    if (raw is Map<String, dynamic>) {
      return raw;
    }
    if (raw is Map) {
      return Map<String, dynamic>.from(raw);
    }
    return null;
  }

  static LatLng? _coordinatesFromFeature(Map<String, dynamic> feature) {
    final geometry = feature['geometry'];
    if (geometry is! Map) {
      return null;
    }
    if (geometry['type'] != 'Point') {
      return null;
    }
    final coords = geometry['coordinates'];
    if (coords is! List || coords.length < 2) {
      return null;
    }
    final lng = coords[0];
    final lat = coords[1];
    if (lng is! num || lat is! num) {
      return null;
    }
    if (!lat.isFinite || !lng.isFinite) {
      return null;
    }
    return LatLng(lat.toDouble(), lng.toDouble());
  }

  /// Expansion zoom from MapLibre, or conservative fallback near [currentZoom].
  static Future<double> resolveExpansionZoom({
    required MapLibreMapController map,
    required int clusterId,
    required double currentZoom,
  }) async {
    try {
      final expansion = await map.getClusterExpansionZoom(
        QalaGoMapBusinessLayerIds.source,
        clusterId,
      );
      if (expansion > 0) {
        return (expansion + 0.5).clamp(0, maxMapZoom).toDouble();
      }
    } catch (_) {
      // Fall through to bounded manual zoom.
    }
    final fallback = currentZoom + fallbackZoomIncrement;
    return fallback.clamp(currentZoom + 0.5, maxMapZoom).toDouble();
  }
}
