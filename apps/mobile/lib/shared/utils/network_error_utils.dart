import 'package:dio/dio.dart';

/// User-facing load errors for catalog/home surfaces (not auth-specific).
String mapUserFacingLoadError(Object error) {
  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionError:
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Не удалось загрузить данные. Проверьте подключение и попробуйте снова.';
      default:
        break;
    }

    final status = error.response?.statusCode;
    if (status != null && status >= 500) {
      return 'Сервис временно недоступен. Попробуйте позже.';
    }
  }

  final text = error.toString();
  if (text.contains('SocketException') ||
      text.contains('Connection') ||
      text.contains('DioException')) {
    return 'Не удалось загрузить данные. Проверьте подключение и попробуйте снова.';
  }

  return 'Не удалось загрузить данные. Проверьте подключение и попробуйте снова.';
}

/// True when [message] is safe to show in consumer UI (no raw Dio/stack traces).
bool isUserFacingLoadMessage(String message) {
  return !message.contains('DioException') &&
      !message.contains('SocketException') &&
      !message.contains('XMLHttpRequest');
}
