import 'qalago_map_business_layer_style.dart';

/// Parsed native map business feature tap (Stage 6.12A.7.2).
class QalaGoMapBusinessFeatureTapTarget {
  const QalaGoMapBusinessFeatureTapTarget({
    required this.locationId,
    required this.businessId,
  });

  /// Physical marker key — [BusinessLocation.id] when present, else legacy Business id.
  final String locationId;

  /// Parent catalog identity — always [Business.id].
  final String businessId;
}

/// Decodes MapLibre feature taps into QalaGo map identities (C.6C / A.7.2).
abstract final class QalaGoMapBusinessFeatureTap {
  static QalaGoMapBusinessFeatureTapTarget? parseTapTarget({
    required String featureId,
    required String layerId,
    Map<String, dynamic>? properties,
  }) {
    if (QalaGoMapBusinessLayerStyle.isClusterLayerId(layerId)) {
      return null;
    }

    if (!QalaGoMapBusinessLayerStyle.isBusinessLayerId(layerId)) {
      return null;
    }

    if (properties != null && properties.containsKey('point_count')) {
      return null;
    }

    final propsBusinessId = properties?['businessId'];
    final propsLocationId = properties?['locationId'];

    final businessId = propsBusinessId is String && propsBusinessId.isNotEmpty
        ? propsBusinessId
        : _nonEmpty(featureId);

    if (businessId == null) {
      return null;
    }

    final locationId = propsLocationId is String && propsLocationId.isNotEmpty
        ? propsLocationId
        : businessId;

    return QalaGoMapBusinessFeatureTapTarget(
      locationId: locationId,
      businessId: businessId,
    );
  }

  /// Legacy helper — returns parent [businessId] only.
  static String? parseBusinessId({
    required String featureId,
    required String layerId,
    Map<String, dynamic>? properties,
  }) {
    return parseTapTarget(
      featureId: featureId,
      layerId: layerId,
      properties: properties,
    )?.businessId;
  }

  static String? _nonEmpty(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty || trimmed == 'null') {
      return null;
    }
    return trimmed;
  }
}
