import 'dart:io';

import 'package:qalago_mobile/core/locale/hardcoded_ui_guard.dart';

/// Run from `apps/mobile`: dart run tool/check_hardcoded_ui_strings.dart
void main() {
  final violations = scanHardcodedConsumerUiStrings();
  if (violations.isEmpty) {
    // ignore: avoid_print
    print('OK: no suspicious hardcoded Cyrillic UI strings.');
    return;
  }
  // ignore: avoid_print
  print('Found ${violations.length} potential hardcoded UI strings:');
  for (final v in violations.take(200)) {
    // ignore: avoid_print
    print(v);
  }
  exit(1);
}
