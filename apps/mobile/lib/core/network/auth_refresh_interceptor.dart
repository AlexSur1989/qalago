import 'package:dio/dio.dart';
import '../storage/auth_storage.dart';

/// One refresh per session, one retry per request, no recovery after logout.
class AuthRefreshInterceptor extends Interceptor {
  AuthRefreshInterceptor(
    this.dio,
    this.refreshClient,
    this.storage,
    this.onExpired,
  );

  final Dio dio;
  final Dio refreshClient;
  final AuthStorage storage;
  final void Function(int generation) onExpired;
  Future<String?>? _refreshInFlight;
  int? _refreshGeneration;
  static const _generationKey = 'qalago.authGeneration';
  static const _retryKey = 'qalago.authRetried';

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    try {
      final session = await storage.readSession();
      final originalGeneration = options.extra[_generationKey];
      if (originalGeneration != null &&
          originalGeneration != session.generation) {
        return handler.reject(
          DioException(
            requestOptions: options,
            type: DioExceptionType.cancel,
            message: 'Session changed',
          ),
        );
      }
      options.extra[_generationKey] = session.generation;
      if (session.token?.isNotEmpty == true) {
        options.headers['Authorization'] = 'Bearer ${session.token}';
      } else {
        options.headers.remove('Authorization');
      }
      handler.next(options);
    } catch (error) {
      handler.reject(DioException(requestOptions: options, error: error));
    }
  }

  Future<void> _expire(int generation) async {
    if (await storage.clearIfCurrent(generation)) onExpired(storage.generation);
  }

  Future<String?> _refresh(StoredSession session) async {
    if (session.refreshToken?.isNotEmpty != true) {
      await _expire(session.generation);
      return null;
    }
    try {
      final response = await refreshClient.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': session.refreshToken},
      );
      final token = response.data?['accessToken'];
      final refresh = response.data?['refreshToken'];
      if (token is! String ||
          token.isEmpty ||
          refresh is! String ||
          refresh.isEmpty) {
        return null;
      }
      return await storage.replaceAfterRefresh(session, token, refresh)
          ? token
          : null;
    } on DioException catch (error) {
      // Network/server failures are not evidence of an invalid session.
      if (error.response?.statusCode == 401) await _expire(session.generation);
      return null;
    }
  }

  Future<String?> _resolve(StoredSession session) async {
    if (_refreshInFlight != null && _refreshGeneration == session.generation) {
      return _refreshInFlight;
    }
    final pending = _refresh(session);
    _refreshGeneration = session.generation;
    _refreshInFlight = pending;
    try {
      return await pending;
    } finally {
      if (identical(_refreshInFlight, pending)) _refreshInFlight = null;
    }
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final request = err.requestOptions;
    if (err.response?.statusCode != 401 ||
        request.uri.path.contains('/auth/')) {
      return handler.next(err);
    }
    try {
      final session = await storage.readSession();
      if (request.extra[_generationKey] != session.generation) {
        return handler.next(err);
      }
      if (request.extra[_retryKey] == true) {
        await _expire(session.generation);
        return handler.next(err);
      }
      // A delayed 401 may refer to a token another request has already rotated.
      final current = session.token;
      final token =
          current != null &&
              request.headers['Authorization'] != 'Bearer $current'
          ? current
          : await _resolve(session);
      if (token == null || storage.generation != session.generation) {
        return handler.next(err);
      }
      request.extra[_retryKey] = true;
      request.headers['Authorization'] = 'Bearer $token';
      if (request.data is FormData) {
        request.data = (request.data as FormData).clone();
      }
      return handler.resolve(await dio.fetch<dynamic>(request));
    } on DioException catch (retryError) {
      return handler.next(retryError);
    } catch (_) {
      return handler.next(err);
    }
  }
}
