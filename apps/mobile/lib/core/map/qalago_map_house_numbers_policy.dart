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

  static bool get isCityAgnostic => true;
}
