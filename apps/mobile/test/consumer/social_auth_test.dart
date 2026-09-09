import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/constants/app_constants.dart';
import 'package:qalago_mobile/features/auth/data/social_auth_platform.dart';
import 'package:qalago_mobile/features/auth/data/social_sign_in_types.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/utils/auth_utils.dart';

void main() {
  group('mapSocialAuthError', () {
    test('returns empty for cancellation', () {
      expect(
        mapSocialAuthError(const SocialSignInCancelled(), providerLabel: 'Google'),
        '',
      );
    });

    test('maps backend 404', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/auth/google'),
        response: Response(
          requestOptions: RequestOptions(path: '/auth/google'),
          statusCode: 404,
        ),
      );
      expect(
        mapSocialAuthError(error, providerLabel: 'Google'),
        contains('временно недоступен'),
      );
    });

    test('maps rate limit', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/auth/apple'),
        response: Response(
          requestOptions: RequestOptions(path: '/auth/apple'),
          statusCode: 429,
        ),
      );
      expect(
        mapSocialAuthError(error, providerLabel: 'Apple'),
        contains('Слишком много попыток'),
      );
    });

    test('maps missing token', () {
      expect(
        mapSocialAuthError(const SocialSignInNoToken(), providerLabel: 'Apple'),
        contains('Apple'),
      );
    });
  });

  group('AuthRepository social endpoints', () {
    test('signInWithGoogle posts idToken only', () async {
      Map<String, dynamic>? captured;
      final dio = Dio();
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            captured = options.data as Map<String, dynamic>?;
            handler.resolve(
              Response(
                requestOptions: options,
                data: {
                  'accessToken': 'jwt',
                  'user': {'id': 'u1', 'role': 'USER', 'phone': null},
                },
              ),
            );
          },
        ),
      );

      final repo = AuthRepository(dio);
      final result = await repo.signInWithGoogle('google-id-token');
      expect(result.token, 'jwt');
      expect(result.user.phone, isNull);
      expect(captured, {'idToken': 'google-id-token'});
    });

    test('signInWithApple posts identityToken only', () async {
      Map<String, dynamic>? captured;
      final dio = Dio();
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            captured = options.data as Map<String, dynamic>?;
            handler.resolve(
              Response(
                requestOptions: options,
                data: {
                  'accessToken': 'jwt',
                  'user': {
                    'id': 'u2',
                    'role': 'USER',
                    'name': null,
                    'phone': null,
                  },
                },
              ),
            );
          },
        ),
      );

      final repo = AuthRepository(dio);
      final result = await repo.signInWithApple('apple-identity-token');
      expect(result.user.name, isNull);
      expect(captured, {'identityToken': 'apple-identity-token'});
    });
  });

  group('GoogleSignInOutcome', () {
    test('cancelled outcome has no token', () {
      const outcome = GoogleSignInOutcome.cancelled();
      expect(outcome.cancelled, isTrue);
      expect(outcome.idToken, isNull);
    });
  });

  group('client flags default', () {
    test('social disabled without dart-define', () {
      expect(AppConstants.googleAuthEnabled, isFalse);
      expect(AppConstants.appleAuthEnabled, isFalse);
      expect(AppConstants.otpAuthEnabled, isTrue);
    });
  });

  group('social auth platform', () {
    test('native social targets mobile platforms only', () {
      if (kIsWeb) {
        expect(isGoogleSignInPlatformSupported(), isFalse);
        expect(isAppleSignInPlatformSupported(), isFalse);
        return;
      }

      expect(
        isGoogleSignInPlatformSupported(),
        defaultTargetPlatform == TargetPlatform.android ||
            defaultTargetPlatform == TargetPlatform.iOS,
      );
      expect(
        isAppleSignInPlatformSupported(),
        defaultTargetPlatform == TargetPlatform.iOS,
      );
    });
  });
}
