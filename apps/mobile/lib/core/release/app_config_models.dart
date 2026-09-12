import 'semver.dart';

class AppConfigSnapshot {
  AppConfigSnapshot({
    required this.configRevision,
    required this.maintenanceEnabled,
    this.maintenanceMessageRu,
    this.maintenanceMessageKk,
    required this.updateMode,
    this.storeUrl,
    required this.featureFlags,
    required this.fetchedAt,
  });

  final int configRevision;
  final bool maintenanceEnabled;
  final String? maintenanceMessageRu;
  final String? maintenanceMessageKk;
  final ClientUpdateMode updateMode;
  final String? storeUrl;
  final Map<String, bool> featureFlags;
  final DateTime fetchedAt;

  factory AppConfigSnapshot.fromJson(Map<String, dynamic> json, ClientUpdateMode updateMode) {
    final maintenance = json['maintenance'] as Map<String, dynamic>? ?? {};
    final flags = json['featureFlags'] as Map<String, dynamic>? ?? {};
    return AppConfigSnapshot(
      configRevision: json['configRevision'] as int? ?? 0,
      maintenanceEnabled: maintenance['enabled'] as bool? ?? false,
      maintenanceMessageRu: maintenance['messageRu'] as String?,
      maintenanceMessageKk: maintenance['messageKk'] as String?,
      updateMode: updateMode,
      storeUrl: json['storeUrl'] as String?,
      featureFlags: flags.map((k, v) => MapEntry(k, v == true)),
      fetchedAt: DateTime.now(),
    );
  }

  bool isFeatureEnabled(String key, {bool fallback = true}) {
    return featureFlags[key] ?? fallback;
  }
}
