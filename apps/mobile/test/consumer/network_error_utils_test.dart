import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/utils/network_error_utils.dart';

void main() {
  group('mapUserFacingLoadError', () {
    test('maps connection error to friendly text', () {
      final message = mapUserFacingLoadError(
        DioException(
          requestOptions: RequestOptions(path: '/businesses'),
          type: DioExceptionType.connectionError,
        ),
      );

      expect(message, contains('Не удалось загрузить данные'));
      expect(message, contains('Проверьте подключение'));
      expect(isUserFacingLoadMessage(message), isTrue);
    });

    test('never exposes raw DioException string', () {
      final message = mapUserFacingLoadError(
        DioException(
          requestOptions: RequestOptions(path: '/x'),
          type: DioExceptionType.connectionError,
          message: 'XMLHttpRequest onError callback was called',
        ),
      );

      expect(message.contains('DioException'), isFalse);
      expect(message.contains('XMLHttpRequest'), isFalse);
    });
  });
}
