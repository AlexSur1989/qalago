import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

/// One stable identifier per app session (survives rebuild/navigation/refresh).
final adSessionIdProvider = Provider<String>((ref) {
  ref.keepAlive();
  return _generateSessionId();
});

String _generateSessionId() {
  final random = Random.secure();
  final bytes = List<int>.generate(16, (_) => random.nextInt(256));
  return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
}
