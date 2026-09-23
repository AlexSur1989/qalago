import 'package:flutter/foundation.dart';

import 'qalago_map_bounds.dart';

/// Temporary MAPDBG tracing for physical viewport refresh diagnosis (debug builds only).
void mapViewportDbg(String message) {
  if (kDebugMode) {
    debugPrint(message);
  }
}

String mapViewportDbgBounds(QalaGoMapBounds? bounds) {
  if (bounds == null) {
    return 'NULL';
  }
  return '${bounds.minLat},${bounds.maxLat},${bounds.minLng},${bounds.maxLng}';
}
