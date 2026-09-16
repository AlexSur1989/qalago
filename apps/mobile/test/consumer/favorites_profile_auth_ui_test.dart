import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/auth/route_access.dart';
import 'package:qalago_mobile/core/constants/app_constants.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/presentation/login_screen.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/favorites/presentation/favorites_screen.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_screen.dart';
import 'package:qalago_mobile/shared/models/models.dart';

import '../support/l10n_test_harness.dart';

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _AuthedAuthNotifier extends AuthNotifier {
  var logoutInvoked = false;

  @override
  AuthState build() => AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: UserModel(
          id: 'u1',
          phone: '+77001234567',
          role: 'USER',
          name: 'Test User',
          avatarUrl: '/uploads/avatar.jpg',
        ),
      );

  @override
  Future<void> logout() async {
    logoutInvoked = true;
  }
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        launchStatus: 'LIVE',
      );
}

void main() {
  test('profile language route is public for guests', () {
    expect(isPublicConsumerRoute('/profile/language'), isTrue);
  });

  group('Favorites UI.6B', () {
    testWidgets('empty favorites shows browse categories CTA', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            favoritesProvider.overrideWith((ref) async => []),
          ],
          child: wrapWithL10n(const FavoritesScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Перейти в категории'), findsOneWidget);
    });

    testWidgets('320 KK 2.0 guest favorites layout', (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 720));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
          ],
          child: wrapWithL10n(
            MediaQuery(
              data: const MediaQueryData(
                size: Size(320, 720),
                textScaler: TextScaler.linear(2.0),
              ),
              child: const FavoritesScreen(),
            ),
            locale: const Locale('kk'),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.text('Кіру'), findsWidgets);
    });
  });

  group('Profile UI.6B', () {
    testWidgets('guest profile shows language and business section',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
          ],
          child: wrapWithL10n(const ProfileScreen()),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);

      expect(find.text('Язык'), findsOneWidget);
      await tester.scrollUntilVisible(
        find.text('Для бизнеса'),
        120,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Для бизнеса'), findsOneWidget);
      await tester.scrollUntilVisible(
        find.text('Найти свой бизнес'),
        120,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Найти свой бизнес'), findsOneWidget);
    });

    testWidgets('authenticated profile shows avatar when avatarUrl set',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            myBusinessEntriesProvider.overrideWith((ref) async => const []),
          ],
          child: wrapWithL10n(const ProfileScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('logout confirmation cancels without leaving', (tester) async {
      final auth = _AuthedAuthNotifier();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => auth),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            myBusinessEntriesProvider.overrideWith((ref) async => const []),
          ],
          child: wrapWithL10n(const ProfileScreen()),
        ),
      );
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(
        find.text('Выйти из аккаунта'),
        200,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.tap(find.text('Выйти из аккаунта'), warnIfMissed: false);
      await tester.pumpAndSettle();
      expect(find.text('Выйти из аккаунта?'), findsOneWidget);

      await tester.tap(
        find.descendant(
          of: find.byType(AlertDialog),
          matching: find.text('Отмена'),
        ),
      );
      await tester.pumpAndSettle();
      expect(auth.logoutInvoked, isFalse);
      expect(find.text('Выйти из аккаунта?'), findsNothing);
      expect(find.text('Выйти из аккаунта'), findsOneWidget);
    });
  });

  group('Login UI.6B', () {
    testWidgets('320 KK 2.0 login scroll layout', (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 640));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
          ],
          child: wrapWithL10n(
            MediaQuery(
              data: const MediaQueryData(
                size: Size(320, 640),
                textScaler: TextScaler.linear(2.0),
              ),
              child: const LoginScreen(),
            ),
            locale: const Locale('kk'),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(AppConstants.devLoginEnabled, isFalse);
    });
  });
}
