/// OpenMapTiles house-number symbol policy (C.6F.2).
///
/// Coverage depends on OSM/OpenMapTiles data only — no fabricated numbers.
abstract final class QalaGoMapHouseNumbersPolicy {
  static const layerId = 'qalago-housenumber';

  static const vectorSourceId = 'openmaptiles';

  static const sourceLayer = 'housenumber';

  static const minZoom = 16.0;

  static const textSize = 10.5;

  static const textColor = '#9CA3AF';

  static const textHaloColor = '#F7F9FB';

  static const textHaloWidth = 0.6;

  static const textFontStack = 'Noto Sans Regular';

  /// MapLibre expression: `['get', 'housenumber']` — no defaults/coercion.
  static List<Object> textFieldExpression() {
    return ['get', 'housenumber'];
  }

  static List<String> textFont() {
    return [textFontStack];
  }

  /// Liberty anchors for inserting house numbers below street/road labels (C.6F.2 FIX 1).
  static const streetLabelStackAnchorLayerIds = [
    'highway-name-path',
    'highway-name-minor',
    'highway-name-major',
  ];

  /// Returns [belowLayerId] for `addSymbolLayer` so street labels stay above numbers.
  static String? resolveBelowStreetLabelsLayerId(List<String> styleLayerIds) {
    final ids = styleLayerIds.toSet();
    for (final anchor in streetLabelStackAnchorLayerIds) {
      if (ids.contains(anchor)) {
        return anchor;
      }
    }
    return null;
  }

  static bool get isCityAgnostic => true;
}
