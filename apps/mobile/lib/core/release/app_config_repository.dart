import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_constants.dart';
import 'app_config_models.dart';
import 'semver.dart';

const _cacheKey = 'qalago_app_config_cache_v1';
const _cacheTtl = Duration(minutes: 15);

class AppConfigRepository {
  AppConfigRepository(this._dio);

  final Dio _dio;

  Future<AppConfigSnapshot> fetchFresh() async {
    final info = await PackageInfo.fromPlatform();
    final platform = !kIsWeb && Platform.isIOS ? 'IOS' : 'ANDROID';
    final response = await _dio.get<Map<String, dynamic>>(
      '/app-config',
      queryParameters: {
        'platform': platform,
        'appVersion': info.version,
        'buildNumber': int.tryParse(info.buildNumber) ?? 1,
        'citySlug': AppConstants.defaultCitySlug,
      },
    );
    final data = response.data ?? {};
    final mobile = data['mobile'] as Map<String, dynamic>? ?? {};
    final platformBlock = mobile[platform.toLowerCase()] as Map<String, dynamic>? ?? {};
    final updateMode = parseClientUpdateMode(platformBlock['updateMode'] as String?);
    final snapshot = AppConfigSnapshot.fromJson(
      {
        ...data,
        'storeUrl': platformBlock['storeUrl'],
      },
      updateMode,
    );
    await _persistCache(snapshot, data);
    return snapshot;
  }

  Future<AppConfigSnapshot> loadEffective() async {
    try {
      final fresh = await fetchFresh();
      return fresh;
    } catch (_) {
      final cached = await _readCache();
      if (cached != null) return cached;
      return AppConfigSnapshot(
        configRevision: 0,
        maintenanceEnabled: false,
        updateMode: ClientUpdateMode.none,
        featureFlags: const {},
        fetchedAt: DateTime.fromMillisecondsSinceEpoch(0),
      );
    }
  }

  Future<void> _persistCache(AppConfigSnapshot snapshot, Map<String, dynamic> raw) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _cacheKey,
      jsonEncode({
        'savedAt': DateTime.now().toIso8601String(),
        'snapshot': {
          'configRevision': snapshot.configRevision,
          'maintenanceEnabled': snapshot.maintenanceEnabled,
          'maintenanceMessageRu': snapshot.maintenanceMessageRu,
          'maintenanceMessageKk': snapshot.maintenanceMessageKk,
          'updateMode': snapshot.updateMode.name,
          'storeUrl': snapshot.storeUrl,
          'featureFlags': snapshot.featureFlags,
        },
      }),
    );
  }

  Future<AppConfigSnapshot?> _readCache() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_cacheKey);
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      final savedAt = DateTime.parse(decoded['savedAt'] as String);
      if (DateTime.now().difference(savedAt) > _cacheTtl) {
        return null;
      }
      final snap = decoded['snapshot'] as Map<String, dynamic>;
      return AppConfigSnapshot(
        configRevision: snap['configRevision'] as int? ?? 0,
        maintenanceEnabled: snap['maintenanceEnabled'] as bool? ?? false,
        maintenanceMessageRu: snap['maintenanceMessageRu'] as String?,
        maintenanceMessageKk: snap['maintenanceMessageKk'] as String?,
        updateMode: parseClientUpdateMode(snap['updateMode'] as String?),
        storeUrl: snap['storeUrl'] as String?,
        featureFlags: (snap['featureFlags'] as Map<String, dynamic>? ?? {})
            .map((k, v) => MapEntry(k, v == true)),
        fetchedAt: savedAt,
      );
    } catch (_) {
      return null;
    }
  }
}
