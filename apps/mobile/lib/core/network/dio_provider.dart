import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../constants/app_constants.dart';
import '../storage/auth_storage.dart';
import 'auth_refresh_interceptor.dart';

/// Invalidated storage generation — [authSessionGuardProvider] clears matching auth state.
final sessionExpiredProvider = StateProvider<int>((ref) => 0);

final authStorageProvider = Provider<AuthStorage>(
  (ref) => AuthStorage(const FlutterSecureStorage()),
);

final dioProvider = Provider<Dio>((ref) {
  assert(() {
    debugPrint('[QalaGo] API baseUrl: ${AppConstants.baseUrl}');
    debugPrint('[QalaGo] Media base: ${AppConstants.mediaBaseUrl}');
    debugPrint('[QalaGo] AI base: ${AppConstants.aiOrchestratorBaseUrl}');
    return true;
  }());

  final dio = Dio(
    BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  final refreshClient = Dio(
    BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );
  ref.onDispose(() {
    refreshClient.close(force: true);
    dio.close(force: true);
  });
  dio.interceptors.add(
    AuthRefreshInterceptor(
      dio,
      refreshClient,
      ref.read(authStorageProvider),
      (generation) =>
          ref.read(sessionExpiredProvider.notifier).state = generation,
    ),
  );
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        if (!kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
          try {
            final info = await PackageInfo.fromPlatform();
            options.headers['X-QalaGo-App-Version'] = info.version;
            options.headers['X-QalaGo-Build-Number'] = info.buildNumber;
            options.headers['X-QalaGo-Platform'] = Platform.isIOS
                ? 'IOS'
                : 'ANDROID';
          } catch (_) {
            // Non-fatal metadata.
          }
        }
        handler.next(options);
      },
    ),
  );

  return dio;
});

final aiDioProvider = Provider<Dio>((ref) => ref.watch(dioProvider));
