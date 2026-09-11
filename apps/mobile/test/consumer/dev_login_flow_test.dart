import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/constants/app_constants.dart';
import 'package:qalago_mobile/core/constants/dev_seed_accounts.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/presentation/dev_quick_login_panel.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/core/network/dio_provider.dart';
import 'package:qalago_mobile/core/storage/auth_storage.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('DEV login flow (auth notifier)', () {
    test('devLogin stores JWT and user on success', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => _FakeAuthRepo()),
          authStorageProvider.overrideWith((ref) => AuthStorage.memory()),
          cityProvider.overrideWith(() => _FixedCityNotifier()),
        ],
      );
      addTearDown(container.dispose);

      await container.read(authProvider.notifier).devLogin('+77000000002');

      final auth = container.read(authProvider);
      expect(auth.isAuthenticated, isTrue);
      expect(auth.user?.role, 'BUSINESS');
    });

    test('devLogin failure clears loading and rethrows', () async {
      final container = ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWith(
            (ref) => _FakeAuthRepo(fail: true),
          ),
          authStorageProvider.overrideWith((ref) => AuthStorage.memory()),
          cityProvider.overrideWith(() => _FixedCityNotifier()),
        ],
      );
      addTearDown(container.dispose);

      await expectLater(
        container.read(authProvider.notifier).devLogin('+77000000001'),
        throwsA(isA<DioException>()),
      );
      expect(container.read(authProvider).isAuthenticated, isFalse);
      expect(container.read(authProvider).isLoading, isFalse);
    });
  });

  if (AppConstants.devLoginEnabled) {
    group('DEV login UI when QALAGO_DEV_LOGIN=true', () {
      testWidgets('shows dev quick login panel', (tester) async {
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authProvider.overrideWith(() => _GuestAuthNotifier()),
            ],
            child: const MaterialApp(home: DevQuickLoginPanel()),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('DEV: быстрый вход без SMS'), findsOneWidget);
        for (final account in devSeedAccounts) {
          expect(find.text(account.label), findsOneWidget);
        }
      });

      testWidgets('Test User chip triggers devLogin', (tester) async {
        final notifier = _RecordingAuthNotifier();
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authProvider.overrideWith(() => notifier),
            ],
            child: const MaterialApp(home: DevQuickLoginPanel()),
          ),
        );
        await tester.pumpAndSettle();

        await tester.tap(find.text('Test User'));
        await tester.pumpAndSettle();

        expect(notifier.lastDevLoginPhone, '+77000000003');
      });

      testWidgets('Business Owner chip triggers devLogin', (tester) async {
        final notifier = _RecordingAuthNotifier();
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authProvider.overrideWith(() => notifier),
            ],
            child: const MaterialApp(home: DevQuickLoginPanel()),
          ),
        );
        await tester.pumpAndSettle();

        await tester.tap(find.text('Business Owner'));
        await tester.pumpAndSettle();

        expect(notifier.lastDevLoginPhone, '+77000000002');
      });

      testWidgets('Admin chip triggers devLogin', (tester) async {
        final notifier = _RecordingAuthNotifier();
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authProvider.overrideWith(() => notifier),
            ],
            child: const MaterialApp(home: DevQuickLoginPanel()),
          ),
        );
        await tester.pumpAndSettle();

        await tester.tap(find.text('Admin'));
        await tester.pumpAndSettle();

        expect(notifier.lastDevLoginPhone, '+77000000001');
      });

      testWidgets('City Admin chip triggers devLogin', (tester) async {
        final notifier = _RecordingAuthNotifier();
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authProvider.overrideWith(() => notifier),
            ],
            child: const MaterialApp(home: DevQuickLoginPanel()),
          ),
        );
        await tester.pumpAndSettle();

        await tester.tap(find.text('City Admin'));
        await tester.pumpAndSettle();

        expect(notifier.lastDevLoginPhone, '+77000000004');
      });
    });
  }
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _FixedCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(slug: 'uralsk', nameRu: 'Уральск');
}

class _RecordingAuthNotifier extends AuthNotifier {
  String? lastDevLoginPhone;

  @override
  AuthState build() => const AuthState(isLoading: false);

  @override
  Future<void> devLogin(String phone) async {
    lastDevLoginPhone = phone;
  }
}

class _FakeAuthRepo extends AuthRepository {
  _FakeAuthRepo({this.fail = false}) : super(Dio());

  final bool fail;

  @override
  Future<({String token, String? refreshToken, UserModel user})> devLogin(
    String phone,
  ) async {
    if (fail) {
      throw DioException(
        requestOptions: RequestOptions(path: '/auth/dev-login'),
        response: Response(
          requestOptions: RequestOptions(path: '/auth/dev-login'),
          statusCode: 404,
        ),
      );
    }

    final role = switch (phone) {
      '+77000000001' => 'ADMIN',
      '+77000000002' => 'BUSINESS',
      '+77000000004' => 'CITY_ADMIN',
      _ => 'USER',
    };

    return (
      token: 'jwt-$phone',
      refreshToken: 'refresh-$phone',
      user: UserModel(
        id: 'u-$phone',
        phone: phone,
        name: 'Dev',
        role: role,
      ),
    );
  }
}
