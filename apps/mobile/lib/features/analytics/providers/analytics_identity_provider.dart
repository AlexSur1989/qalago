import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _visitorPrefsKey = 'qalago_analytics_visitor_id_v1';
const analyticsSessionTimeoutMs = 30 * 60 * 1000;

/// Privacy-safe first-party visitor id (persisted, random, not hardware-derived).
final analyticsVisitorIdProvider = FutureProvider<String>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  var visitorId = prefs.getString(_visitorPrefsKey);
  if (visitorId == null || visitorId.length < 16) {
    visitorId = _generateHexId(32);
    await prefs.setString(_visitorPrefsKey, visitorId);
  }
  return visitorId;
});

/// Session id with 30-minute inactivity rotation.
final analyticsSessionIdProvider = Provider<String>((ref) {
  ref.keepAlive();
  final holder = _AnalyticsSessionHolder();
  ref.onDispose(holder.dispose);
  return holder.sessionId;
});

class _AnalyticsSessionHolder {
  _AnalyticsSessionHolder() {
    _sessionId = _generateHexId(32);
    _touch();
  }

  late String _sessionId;
  DateTime _lastActivity = DateTime.now();

  String get sessionId {
    _maybeRotate();
    _touch();
    return _sessionId;
  }

  void _touch() {
    _lastActivity = DateTime.now();
  }

  void _maybeRotate() {
    final elapsed = DateTime.now().difference(_lastActivity).inMilliseconds;
    if (elapsed >= analyticsSessionTimeoutMs) {
      _sessionId = _generateHexId(32);
    }
  }

  void dispose() {}
}

String _generateHexId(int byteLength) {
  final random = Random.secure();
  return List.generate(byteLength, (_) => random.nextInt(256))
      .map((b) => b.toRadixString(16).padLeft(2, '0'))
      .join();
}
