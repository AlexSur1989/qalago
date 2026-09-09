import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/auth/route_access.dart';
import 'package:qalago_mobile/core/network/dio_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/storage/auth_storage.dart';
import 'package:qalago_mobile/features/auth/presentation/login_screen.dart';
import 'package:qalago_mobile/core/storage/auth_storage.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/favorites/presentation/favorites_screen.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_screen.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/utils/auth_utils.dart';

void main() {
  group('guest/public routes', () {
    test('core consumer routes remain public', () {
      expect(isPublicConsumerRoute('/home'), isTrue);
      expect(isPublicConsumerRoute('/categories'), isTrue);
      expect(isPublicConsumerRoute('/categories/food'), isTrue);
      expect(isPublicConsumerRoute('/search'), isTrue);
      expect(isPublicConsumerRoute('/map'), isTrue);
      expect(isPublicConsumerRoute('/promotions'), isTrue);
      expect(isPublicConsumerRoute('/business/b1'), isTrue);
      expect(isPublicConsumerRoute('/profile'), isTrue);
      expect(isPublicConsumerRoute('/favorites'), isTrue);
    });

    testWidgets('guest profile shows login CTA', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
          ],
          child: const MaterialApp(home: ProfileScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Войдите в QalaGo'), findsOneWidget);
      expect(find.text('Войти'), findsOneWidget);
      expect(find.text('Кабинет бизнеса'), findsNothing);
    });

    testWidgets('guest favorites shows login prompt', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
          ],
          child: const MaterialApp(home: FavoritesScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Войдите, чтобы сохранять избранное'), findsOneWidget);
    });
  });

  group('login screen polish', () {
    testWidgets('shows guest continue and phone auth', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
          ],
          child: const MaterialApp(home: LoginScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Продолжить без аккаунта'), findsOneWidget);
      expect(find.text('Получить код'), findsOneWidget);
      expect(find.textContaining('demo'), findsNothing);
      expect(find.textContaining('77000000003'), findsNothing);
    });
  });

  group('auth state transitions', () {
    test('logout invalidates favorites cache', () async {
      var fetchCount = 0;
      final container = ProviderContainer(
        overrides: [
          authStorageProvider.overrideWith((ref) => AuthStorage.memory()),
          authProvider.overrideWith(() => _AuthedAuthNotifier()),
          favoritesProvider.overrideWith((ref) async {
            if (!ref.watch(authProvider).isAuthenticated) return [];
            fetchCount++;
            return [
              {
                'id': 'f1',
                'business': {
                  'id': 'b1',
                  'title': 'Secret Place',
                  'slug': 'secret',
                  'address': 'A',
                  'city': {'slug': 'uralsk'},
                },
              },
            ];
          }),
        ],
      );
      addTearDown(container.dispose);
      container.read(userScopedCacheCleanupProvider);

      final before = await container.read(favoritesProvider.future);
      expect(before, hasLength(1));

      await container.read(authProvider.notifier).logout();

      final after = await container.read(favoritesProvider.future);
      expect(after, isEmpty);
      expect(fetchCount, greaterThanOrEqualTo(1));
    });

    test('logout preserves selected city slug', () async {
      final container = ProviderContainer(
        overrides: [
          authStorageProvider.overrideWith((ref) => AuthStorage.memory()),
          cityProvider.overrideWith(() => _UralskCityNotifier()),
        ],
      );
      addTearDown(container.dispose);
      container.read(userScopedCacheCleanupProvider);

      final notifier = container.read(authProvider.notifier);
      await notifier.logout();

      expect(container.read(cityProvider).slug, 'uralsk');
    });

    test('handleUnauthorized clears authenticated state', () async {
      final container = ProviderContainer(
        overrides: [
          authStorageProvider.overrideWith((ref) => AuthStorage.memory()),
          authProvider.overrideWith(() => _AuthedAuthNotifier()),
        ],
      );
      addTearDown(container.dispose);
      container.read(userScopedCacheCleanupProvider);

      await container.read(authProvider.notifier).handleUnauthorized();

      expect(container.read(authProvider).isAuthenticated, isFalse);
    });
  });

  group('redirect after login', () {
    test('router uses safe internal redirect', () {
      expect(
        sanitizeLoginRedirect('/profile'),
        '/profile',
      );
      expect(
        sanitizeLoginRedirect('/business/b1'),
        '/business/b1',
      );
      expect(
        sanitizeLoginRedirect('https://evil.com'),
        '/home',
      );
    });
  });
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _AuthedAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: UserModel(
          id: 'u1',
          phone: '+77771234567',
          name: 'Test User',
          role: 'USER',
        ),
      );
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
