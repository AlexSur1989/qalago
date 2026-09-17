import 'package:flutter/widgets.dart';

/// Active QalaGo mobile map renderer (Stage 6.11C.2).
enum QalaGoMapRenderer {
  mapLibre,
  flutterMap,
}

bool _isAutomatedWidgetTestBinding() {
  try {
    final name = WidgetsBinding.instance.runtimeType.toString();
    return name.contains('TestWidgetsFlutterBinding') ||
        name.contains('LiveTestWidgetsFlutterBinding');
  } catch (_) {
    return false;
  }
}

/// Parses renderer name from config (testable).
QalaGoMapRenderer parseQalaGoMapRenderer(String raw) {
  switch (raw.trim().toLowerCase()) {
    case 'maplibre':
    case 'map_libre':
      return QalaGoMapRenderer.mapLibre;
    case 'flutter_map':
    case 'fluttermap':
      return QalaGoMapRenderer.flutterMap;
    default:
      return QalaGoMapRenderer.flutterMap;
  }
}

/// `QALAGO_MAP_RENDERER` dart-define: `maplibre` or `flutter_map`.
///
/// When unset: MapLibre in app/runtime builds; flutter_map during automated
/// widget tests (MapLibre needs native embedding).
QalaGoMapRenderer resolveQalaGoMapRenderer() {
  const raw = String.fromEnvironment('QALAGO_MAP_RENDERER');
  if (raw.isEmpty) {
    if (_isAutomatedWidgetTestBinding()) {
      return QalaGoMapRenderer.flutterMap;
    }
    return QalaGoMapRenderer.mapLibre;
  }
  return parseQalaGoMapRenderer(raw);
}
