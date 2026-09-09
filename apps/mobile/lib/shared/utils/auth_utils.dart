/// Auth helpers — phone normalization, safe redirects, user-facing errors (Stage 5E).
library;

import 'package:dio/dio.dart';

/// Normalizes Kazakhstan mobile numbers to E.164 `+7XXXXXXXXXX`.
/// Returns null when the input cannot represent a valid KZ mobile (11 digits, starts with 7).
String? normalizeKazakhstanPhone(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return null;

  var digits = trimmed.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return null;

  if (digits.length == 11 && digits.startsWith('8')) {
    digits = '7${digits.substring(1)}';
  }

  // 10 digits when user omits country code (+7 shown separately in UI)
  if (digits.length == 10 && digits.startsWith('7')) {
    digits = '7$digits';
  }

  if (digits.length == 11 && digits.startsWith('7')) {
    return '+$digits';
  }

  if (trimmed.startsWith('+') && digits.length == 11 && digits.startsWith('7')) {
    return '+$digits';
  }

  return null;
}

/// Formats +7XXXXXXXXXX for display as +7 XXX XXX XX XX
String formatKazakhstanPhone(String phone) {
  final normalized = normalizeKazakhstanPhone(phone);
  if (normalized == null || normalized.length != 12) return phone;
  final d = normalized.substring(2);
  return '+7 ${d.substring(0, 3)} ${d.substring(3, 6)} ${d.substring(6, 8)} ${d.substring(8)}';
}

/// Allowed internal redirect targets after login. Rejects open redirects.
String sanitizeLoginRedirect(String? redirect, {String fallback = '/home'}) {
  if (redirect == null || redirect.trim().isEmpty) return fallback;

  final value = redirect.trim();

  if (value.contains('://') ||
      value.startsWith('//') ||
      value.toLowerCase().startsWith('javascript:')) {
    return fallback;
  }

  Uri uri;
  try {
    uri = Uri.parse(value);
  } catch (_) {
    return fallback;
  }

  if (uri.hasScheme && uri.scheme != 'http' && uri.scheme != 'https') {
    return fallback;
  }

  if (uri.hasAuthority &&
      uri.host.isNotEmpty &&
      uri.host != 'localhost' &&
      !uri.host.endsWith('.qalago.kz')) {
    return fallback;
  }

  var path = uri.path;
  if (path.isEmpty) path = '/';

  if (!path.startsWith('/')) return fallback;

  final blockedPrefixes = ['/login'];
  for (final prefix in blockedPrefixes) {
    if (path == prefix || path.startsWith('$prefix/')) return fallback;
  }

  if (uri.hasQuery) {
    return '$path?${uri.query}';
  }
  return path;
}

String mapAuthError(Object error) {
  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return 'Не удалось подключиться. Попробуйте ещё раз.';
      default:
        break;
    }

    final status = error.response?.statusCode;
    final message = _backendMessage(error.response?.data);

    if (status == 401) {
      if (message != null &&
          message.toLowerCase().contains('invalid or expired')) {
        return 'Неверный или просроченный код';
      }
      return 'Неверный код';
    }
    if (status == 400) {
      if (message != null && message.toLowerCase().contains('phone')) {
        return 'Проверьте номер телефона';
      }
      return 'Проверьте введённые данные';
    }
    if (status == 429) {
      return 'Слишком много попыток. Попробуйте позже.';
    }
    if (status != null && status >= 500) {
      return 'Сервис временно недоступен. Попробуйте позже.';
    }
  }

  final text = error.toString();
  if (text.contains('SocketException') || text.contains('Connection')) {
    return 'Не удалось подключиться. Попробуйте ещё раз.';
  }

  return 'Что-то пошло не так. Попробуйте ещё раз.';
}

String? _backendMessage(Object? data) {
  if (data is Map) {
    final msg = data['message'];
    if (msg is String) return msg;
    if (msg is List && msg.isNotEmpty) return msg.first.toString();
  }
  return null;
}

bool isValidOtpCode(String code) {
  final trimmed = code.trim();
  return RegExp(r'^\d{4,6}$').hasMatch(trimmed);
}

/// User-facing message for Google/Apple login failures.
/// Returns empty string for silent cancellation (no SnackBar).
String mapSocialAuthError(Object error, {required String providerLabel}) {
  if (error is SocialSignInCancelled) {
    return '';
  }

  if (error is DioException) {
    final status = error.response?.statusCode;
    if (status == 404) {
      return 'Вход через $providerLabel временно недоступен.';
    }
    if (status == 401) {
      return 'Не удалось войти через $providerLabel. Попробуйте ещё раз.';
    }
    if (status == 429) {
      return 'Слишком много попыток. Попробуйте позже.';
    }
    if (status != null && status >= 500) {
      return 'Сервис временно недоступен. Попробуйте позже.';
    }
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return 'Не удалось подключиться. Попробуйте ещё раз.';
      default:
        break;
    }
  }

  if (error is SocialSignInNoToken) {
    return 'Не удалось войти через $providerLabel. Попробуйте ещё раз.';
  }

  final text = error.toString();
  if (text.contains('SocketException') || text.contains('Connection')) {
    return 'Не удалось подключиться. Попробуйте ещё раз.';
  }

  return 'Не удалось войти через $providerLabel. Попробуйте ещё раз.';
}

/// Thrown when user cancels provider UI — not an error.
class SocialSignInCancelled implements Exception {
  const SocialSignInCancelled();
}

/// Provider SDK completed without a usable identity token.
class SocialSignInNoToken implements Exception {
  const SocialSignInNoToken();
}
