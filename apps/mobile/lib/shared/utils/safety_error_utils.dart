import 'package:dio/dio.dart';

/// Stage 6.8C app-config defaults keep safety flags OFF until rollout.
const defaultSafetyFeatureFlagsOff = true;

String mapAccountDeletionError(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['code'] == 'BUSINESS_OWNERSHIP_REQUIRES_RESOLUTION') {
      return 'Перед удалением передайте управление заведением другому владельцу или обратитесь в поддержку.';
    }
    if (error.response?.statusCode == 409) {
      return 'Невозможно удалить аккаунт. Проверьте владение заведениями или обратитесь в поддержку.';
    }
  }
  return 'Не удалось удалить аккаунт. Попробуйте позже.';
}
