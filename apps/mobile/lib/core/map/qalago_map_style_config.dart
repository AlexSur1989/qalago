/// MapLibre style URL configuration (Stage 6.11C.2).
///
/// Default uses MapLibre demo tiles — **DEVELOPMENT / QA ONLY** until a
/// production tile/style provider is approved (6.11C+).
abstract final class QalaGoMapStyleConfig {
  static const defaultDevelopmentStyleUrl =
      'https://demotiles.maplibre.org/style.json';

  /// `QALAGO_MAP_STYLE_URL` dart-define overrides the MapLibre style JSON URL.
  static String styleUrl = const String.fromEnvironment(
    'QALAGO_MAP_STYLE_URL',
    defaultValue: defaultDevelopmentStyleUrl,
  );

  static const mapLibreAttribution = '© MapLibre';
  static const openStreetMapAttribution = '© OpenStreetMap contributors';
}
