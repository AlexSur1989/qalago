import 'qalago_map_business_layer_ids.dart';

/// Pure MapLibre layer/filter definitions for QalaGo catalog businesses (C.6C).
abstract final class QalaGoMapBusinessLayerStyle {
  static const normalCircleRadius = 10.0;
  static const selectedCircleRadius = 14.0;
  static const selectedStrokeWidth = 3.0;
  static const selectedStrokeColor = '#FFFFFF';

  static List<Object> normalBusinessFilter() {
    return [
      'all',
      ['!', ['has', 'point_count']],
      ['==', ['get', 'selected'], 0],
    ];
  }

  static List<Object> selectedBusinessFilter() {
    return [
      'all',
      ['!', ['has', 'point_count']],
      ['==', ['get', 'selected'], 1],
    ];
  }

  static bool isBusinessLayerId(String? layerId) {
    if (layerId == null || layerId.isEmpty) {
      return false;
    }
    return layerId == QalaGoMapBusinessLayerIds.unclustered ||
        layerId == QalaGoMapBusinessLayerIds.selected;
  }
}
