import 'package:dio/dio.dart';

import '../../../shared/utils/network_error_utils.dart';

/// User-facing errors for owner team operations (no raw Dio/stack traces).
String mapTeamOperationError(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) {
        if (_isSafeBackendMessage(message)) return message;
      }
      if (message is List && message.isNotEmpty) {
        final first = message.first;
        if (first is String && _isSafeBackendMessage(first)) return first;
      }
    }

    final status = error.response?.statusCode;
    if (status == 403) {
      return 'У вас нет прав для этого действия.';
    }
    if (status == 404) {
      return 'Запись не найдена.';
    }
    if (status == 409) {
      return 'Достигнут лимит менеджеров вашего тарифа.';
    }
  }

  final fallback = mapUserFacingLoadError(error);
  if (isUserFacingLoadMessage(fallback)) return fallback;
  return 'Не удалось выполнить действие. Попробуйте позже.';
}

String mapInvitationResolveError(Object error) {
  if (error is DioException && error.response?.statusCode == 404) {
    return 'Приглашение не найдено или ссылка недействительна.';
  }
  return mapTeamOperationError(error);
}

String invitationStatusMessageRu(String status) {
  switch (status) {
    case 'PENDING':
      return 'Приглашение активно';
    case 'ACCEPTED':
      return 'Приглашение уже принято';
    case 'REVOKED':
      return 'Приглашение отозвано';
    case 'EXPIRED':
      return 'Срок приглашения истёк';
    default:
      return status;
  }
}

bool _isSafeBackendMessage(String message) {
  if (message.contains('DioException') ||
      message.contains('SocketException') ||
      message.contains('Prisma')) {
    return false;
  }
  return true;
}

bool isUserFacingTeamMessage(String message) {
  return isUserFacingLoadMessage(message) &&
      !message.contains('Exception') &&
      !message.contains('Error:');
}
