import 'business_map_category_colors.dart';
import 'qalago_map_business_cluster_config.dart';
import 'qalago_map_business_layer_ids.dart';

/// Pure MapLibre layer/filter definitions for QalaGo catalog businesses.
abstract final class QalaGoMapBusinessLayerStyle {
  static const normalCircleRadius = 10.0;
  static const selectedCircleRadius = 14.0;
  static const selectedStrokeWidth = 3.0;
  static const selectedStrokeColor = '#FFFFFF';
  static const clusterFillColor = BusinessMapCategoryColors.defaultHex;
  static const clusterStrokeColor = '#FFFFFF';

  /// C.6D FIX 1: constant cluster paint until physical PASS (then re-tune).
  static const fix1ClusterCircleRadius = 22.0;
  static const fix1ClusterCircleOpacity = 1.0;
  static const fix1ClusterStrokeWidth = 4.0;

  /// OpenFreeMap Liberty uses Noto Sans (glyphs on tiles.openfreemap.org).
  static const fix1ClusterCountFontStack = 'Noto Sans Regular';

  static List<Object> fix1ClusterCountTextField() {
    return ['get', 'point_count'];
  }

  static List<String> fix1ClusterCountTextFont() {
    return [fix1ClusterCountFontStack];
  }

  static List<Object> clusterFeatureFilter() {
    return [
      'has',
      'point_count',
    ];
  }

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

  /// Modest step scaling by cluster size (tuning, not contract).
  static List<Object> clusterCircleRadiusExpression() {
    return [
      'step',
      ['get', 'point_count'],
      18,
      10,
      22,
      50,
      28,
    ];
  }

  static List<Object> clusterCountTextExpression() {
    return [
      'coalesce',
      ['get', 'point_count_abbreviated'],
      ['to-string', ['get', 'point_count']],
    ];
  }

  static bool isClusterLayerId(String? layerId) {
    if (layerId == null || layerId.isEmpty) {
      return false;
    }
    return layerId == QalaGoMapBusinessLayerIds.clusterCircles ||
        layerId == QalaGoMapBusinessLayerIds.clusterCount;
  }

  static bool isBusinessLayerId(String? layerId) {
    if (layerId == null || layerId.isEmpty) {
      return false;
    }
    return layerId == QalaGoMapBusinessLayerIds.unclustered ||
        layerId == QalaGoMapBusinessLayerIds.selected;
  }

  static List<String> allManagedLayerIds() {
    return [
      QalaGoMapBusinessLayerIds.clusterCircles,
      QalaGoMapBusinessLayerIds.clusterCount,
      QalaGoMapBusinessLayerIds.unclustered,
      QalaGoMapBusinessLayerIds.selected,
    ];
  }

  static bool get clusteringEnabledOnSource =>
      QalaGoMapBusinessClusterConfig.enabledOnSource;
}
