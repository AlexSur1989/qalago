import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_constants.dart';
import '../storage/auth_storage.dart';

/// Incremented when API returns 401 — [authSessionGuardProvider] clears auth state.
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

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await ref.read(authStorageProvider).readToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final status = error.response?.statusCode;
        final path = error.requestOptions.path;
        if (status == 401 && !path.contains('/auth/refresh')) {
          final storage = ref.read(authStorageProvider);
          final refresh = await storage.readRefreshToken();
          if (refresh != null && refresh.isNotEmpty) {
            try {
              final refreshClient = Dio(
                BaseOptions(
                  baseUrl: AppConstants.baseUrl,
                  headers: {'Content-Type': 'application/json'},
                ),
              );
              final response = await refreshClient.post(
                '/auth/refresh',
                data: {'refreshToken': refresh},
              );
              final data = response.data as Map<String, dynamic>;
              final rotated = (
                token: data['accessToken'] as String,
                refreshToken: data['refreshToken'] as String,
              );
              await storage.saveToken(rotated.token);
              await storage.saveRefreshToken(rotated.refreshToken);
              final req = error.requestOptions;
              req.headers['Authorization'] = 'Bearer ${rotated.token}';
              final clone = await dio.fetch(req);
              return handler.resolve(clone);
            } catch (_) {
              await storage.clear();
              ref.read(sessionExpiredProvider.notifier).state++;
            }
          } else {
            await storage.clear();
            ref.read(sessionExpiredProvider.notifier).state++;
          }
        }
        handler.next(error);
      },
    ),
  );

  return dio;
});

final aiDioProvider = Provider<Dio>((ref) => ref.watch(dioProvider));
