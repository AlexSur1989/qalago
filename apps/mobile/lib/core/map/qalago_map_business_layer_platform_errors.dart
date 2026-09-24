import 'package:flutter/services.dart';

/// Classifies MapLibre platform errors for idempotent business-layer install.
abstract final class QalaGoMapBusinessLayerPlatformErrors {
  static bool isAlreadyExists(PlatformException e) {
    final code = e.code.toLowerCase();
    final message = (e.message ?? '').toLowerCase();
    final details = e.details?.toString().toLowerCase() ?? '';
    final combined = '$code $message $details';
    return combined.contains('already exists') ||
        combined.contains('alreadyexist') ||
        combined.contains('duplicate') ||
        code.contains('cannotaddlayer') ||
        code.contains('cannotaddsource');
  }

  static bool isStyleNotReady(PlatformException e) {
    final code = e.code.toLowerCase();
    return code.contains('style') && code.contains('not');
  }
}
