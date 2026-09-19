import 'qalago_map_business_layer_style.dart';

/// Decodes MapLibre feature taps into QalaGo catalog business ids (C.6C).
abstract final class QalaGoMapBusinessFeatureTap {
  /// Returns [businessId] when [featureId] and [layerId] identify a QalaGo point.
  static String? parseBusinessId({
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

    final fromProps = properties?['businessId'];
    if (fromProps is String && fromProps.isNotEmpty) {
      return fromProps;
    }

    final trimmed = featureId.trim();
    if (trimmed.isEmpty) {
      return null;
    }

    if (trimmed == 'null') {
      return null;
    }

    return trimmed;
  }
}
