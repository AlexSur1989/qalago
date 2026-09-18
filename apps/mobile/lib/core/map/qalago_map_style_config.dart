/// MapLibre style URL configuration (Stage 6.11C.2).
///
/// Default uses [OpenFreeMap Liberty](https://openfreemap.org/) — **DEVELOPMENT /
/// QA ONLY** until a production tile/style provider is approved (6.11C+).
abstract final class QalaGoMapStyleConfig {
  static const defaultDevelopmentStyleUrl =
      'https://tiles.openfreemap.org/styles/liberty';

  /// `QALAGO_MAP_STYLE_URL` dart-define overrides the MapLibre style JSON URL.
  static String styleUrl = const String.fromEnvironment(
    'QALAGO_MAP_STYLE_URL',
    defaultValue: defaultDevelopmentStyleUrl,
  );

  /// OpenFreeMap public-instance attribution (see openfreemap.org).
  static const openFreeMapAttribution = '© OpenFreeMap';
  static const openMapTilesAttribution = '© OpenMapTiles';
  static const openStreetMapAttribution = '© OpenStreetMap contributors';
}
