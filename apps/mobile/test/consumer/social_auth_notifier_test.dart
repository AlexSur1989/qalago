import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/network/dio_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/storage/auth_storage.dart';
import 'package:qalago_mobile/features/auth/data/social_sign_in_types.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/utils/auth_utils.dart';

class _MockGoogleGateway implements GoogleSignInGateway {
  _MockGoogleGateway(this.outcome, {this.onSignIn});

  final GoogleSignInOutcome outcome;
  final Future<void> Function()? onSignIn;
  int callCount = 0;

  @override
  Future<GoogleSignInOutcome> signIn() async {
    callCount += 1;
    if (onSignIn != null) await onSignIn!();
    return outcome;
  }
}

class _MockAppleGateway implements AppleSignInGateway {
  _MockAppleGateway(this.outcome);

  final AppleSignInOutcome outcome;
  int callCount = 0;

  @override
  Future<AppleSignInOutcome> signIn() async {
    callCount += 1;
    return outcome;
  }
}

AuthRepository _socialRepo({
  required void Function(String path, Map<String, dynamic>? body) onPost,
}) {
  final dio = Dio();
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        if (options.method == 'POST') {
          onPost(
            options.path,
            options.data is Map<String, dynamic>
                ? options.data as Map<String, dynamic>
                : null,
          );
        }
        handler.resolve(
          Response(
            requestOptions: options,
            data: {
              'accessToken': 'qalago-jwt',
              'user': {
                'id': 'u-social',
                'role': 'USER',
                'phone': null,
                'name': null,
              },
            },
          ),
        );
      },
    ),
  );
  return AuthRepository(dio);
}

Future<void> _waitForAuthInit(ProviderContainer container) async {
  for (var i = 0; i < 20; i++) {
    await Future<void>.delayed(Duration.zero);
    if (!container.read(authProvider).isLoading) return;
  }
}

List<Override> _baseOverrides({
  required AuthStorage storage,
  required AuthRepository repo,
}) {
  return [
    authStorageProvider.overrideWith((ref) => storage),
    authRepositoryProvider.overrideWith((ref) => repo),
    cityProvider.overrideWith(() => _UralskCityNotifier()),
  ];
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AuthNotifier social login', () {
    test('Google success stores JWT and authenticates', () async {
      final storage = AuthStorage.memory();
      var backendCalls = 0;
      final google = _MockGoogleGateway(
        const GoogleSignInOutcome.success('google-id'),
      );

      final container = ProviderContainer(
        overrides: [
          ..._baseOverrides(
            storage: storage,
            repo: _socialRepo(
              onPost: (path, body) {
                backendCalls += 1;
                expect(path, '/auth/google');
                expect(body, {'idToken': 'google-id'});
              },
            ),
          ),
          googleSignInGatewayProvider.overrideWith((ref) => google),
        ],
      );
      addTearDown(container.dispose);
      await _waitForAuthInit(container);

      await container.read(authProvider.notifier).signInWithGoogle();

      expect(container.read(authProvider).isAuthenticated, isTrue);
      expect(container.read(authProvider).user?.phone, isNull);
      expect(await storage.readToken(), 'qalago-jwt');
      expect(backendCalls, 1);
      expect(google.callCount, 1);
    });

    test('Google cancel does not call backend', () async {
      final google = _MockGoogleGateway(const GoogleSignInOutcome.cancelled());
      var backendCalls = 0;

      final container = ProviderContainer(
        overrides: [
          ..._baseOverrides(
            storage: AuthStorage.memory(),
            repo: _socialRepo(
              onPost: (path, body) => backendCalls += 1,
            ),
          ),
          googleSignInGatewayProvider.overrideWith((ref) => google),
        ],
      );
      addTearDown(container.dispose);
      await _waitForAuthInit(container);

      await expectLater(
        container.read(authProvider.notifier).signInWithGoogle(),
        throwsA(isA<SocialSignInCancelled>()),
      );

      expect(backendCalls, 0);
      expect(container.read(authProvider).isAuthenticated, isFalse);
    });

    test('Apple success sends identityToken only', () async {
      Map<String, dynamic>? captured;
      final apple = _MockAppleGateway(
        const AppleSignInOutcome.success('apple-token'),
      );

      final container = ProviderContainer(
        overrides: [
          ..._baseOverrides(
            storage: AuthStorage.memory(),
            repo: _socialRepo(
              onPost: (path, body) {
                expect(path, '/auth/apple');
                captured = body;
              },
            ),
          ),
          appleSignInGatewayProvider.overrideWith((ref) => apple),
        ],
      );
      addTearDown(container.dispose);
      await _waitForAuthInit(container);

      await container.read(authProvider.notifier).signInWithApple();

      expect(captured, {'identityToken': 'apple-token'});
      expect(container.read(authProvider).isAuthenticated, isTrue);
    });

    test('double tap prevents duplicate Google exchange while in flight', () async {
      final gate = Completer<void>();
      final google = _MockGoogleGateway(
        const GoogleSignInOutcome.success('token'),
        onSignIn: () => gate.future,
      );
      var backendCalls = 0;

      final container = ProviderContainer(
        overrides: [
          ..._baseOverrides(
            storage: AuthStorage.memory(),
            repo: _socialRepo(
              onPost: (path, body) => backendCalls += 1,
            ),
          ),
          googleSignInGatewayProvider.overrideWith((ref) => google),
        ],
      );
      addTearDown(container.dispose);
      await _waitForAuthInit(container);

      final notifier = container.read(authProvider.notifier);
      final first = notifier.signInWithGoogle();
      await Future<void>.delayed(Duration.zero);
      final second = notifier.signInWithGoogle();
      gate.complete();
      await first;
      await second;

      expect(google.callCount, 1);
      expect(backendCalls, 1);
    });

    test('backend 401 leaves user unauthenticated', () async {
      final dio = Dio();
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            handler.reject(
              DioException(
                requestOptions: options,
                response: Response(
                  requestOptions: options,
                  statusCode: 401,
                ),
              ),
            );
          },
        ),
      );

      final container = ProviderContainer(
        overrides: [
          ..._baseOverrides(
            storage: AuthStorage.memory(),
            repo: AuthRepository(dio),
          ),
          googleSignInGatewayProvider.overrideWith(
            (ref) => _MockGoogleGateway(
              const GoogleSignInOutcome.success('bad-token'),
            ),
          ),
        ],
      );
      addTearDown(container.dispose);
      await _waitForAuthInit(container);

      await expectLater(
        container.read(authProvider.notifier).signInWithGoogle(),
        throwsA(isA<DioException>()),
      );
      expect(container.read(authProvider).isAuthenticated, isFalse);
    });
  });
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        launchStatus: 'LIVE',
        centerLat: 51.23,
        centerLng: 51.38,
      );
}
