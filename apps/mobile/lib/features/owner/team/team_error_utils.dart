import 'package:dio/dio.dart';

import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/network_error_utils.dart';
import '../utils/owner_l10n.dart';

/// User-facing errors for owner team operations (no raw Dio/stack traces).
String mapTeamOperationError(AppLocalizations l10n, Object error) {
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
      return l10n.ownerTeamForbidden;
    }
    if (status == 404) {
      return l10n.ownerTeamNotFound;
    }
    if (status == 409) {
      return l10n.ownerTeamManagerLimit;
    }
  }

  final fallback = mapUserFacingLoadError(error);
  if (isUserFacingLoadMessage(fallback)) return fallback;
  return l10n.ownerTeamActionFailed;
}

String mapInvitationResolveError(AppLocalizations l10n, Object error) {
  if (error is DioException && error.response?.statusCode == 404) {
    return l10n.ownerInviteNotFound;
  }
  return mapTeamOperationError(l10n, error);
}

@Deprecated('Use invitationStatusMessage from owner_l10n.dart')
String invitationStatusMessageRu(AppLocalizations l10n, String status) =>
    invitationStatusMessage(l10n, status);

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
