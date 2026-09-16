import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/constants/app_constants.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/core/rbac/business_access.dart';
import 'package:qalago_mobile/core/release/release_environment.dart';
import 'package:qalago_mobile/features/auth/data/social_auth_platform.dart';
import 'package:qalago_mobile/features/auth/presentation/login_screen.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/features/favorites/presentation/favorites_screen.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_screen.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/utils/auth_utils.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../support/l10n_test_harness.dart';

Future<void> _disposeTrackedImpressionTimers(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump(const Duration(milliseconds: 700));
}

Map<String, dynamic> _favoriteItem({
  required String businessId,
  required String title,
  String citySlug = 'uralsk',
}) {
  return {
    'id': 'f-$businessId',
    'createdAt': '2026-09-01T00:00:00.000Z',
    'business': {
      'id': businessId,
      'title': title,
      'slug': title.toLowerCase().replaceAll(' ', '-'),
      'address': 'Street 1',
      'category': {'title': 'Кафе'},
      'city': {'slug': citySlug, 'nameRu': 'Уральск'},
    },
  };
}

class _RecordingFavoritesRepository extends FavoritesRepository {
  _RecordingFavoritesRepository(this._onRemove) : super(Dio());

  final Future<void> Function(String businessId) _onRemove;
  final removedIds = <String>[];

  @override
  Future<void> remove(String businessId) async {
    removedIds.add(businessId);
    await _onRemove(businessId);
  }
}

class _RecordingCatalogRepository extends CatalogRepository {
  _RecordingCatalogRepository() : super(Dio());

  final trackedRemoveIds = <String>[];

  @override
  Future<void> trackFavoriteRemove(
    String businessId, {
    String? sessionId,
    String? visitorId,
  }) async {
    trackedRemoveIds.add(businessId);
  }
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _AuthedUserNotifier extends AuthNotifier {
  _AuthedUserNotifier({this.userRole = 'USER', this.avatarUrl = '/uploads/avatar.jpg'});

  final String userRole;
  final String? avatarUrl;
  var logoutInvoked = false;

  @override
  AuthState build() => AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: UserModel(
          id: 'u1',
          phone: '+77001234567',
          role: userRole,
          name: 'Test User',
          avatarUrl: avatarUrl,
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

MyBusinessEntry _entry({
  required String id,
  required String title,
  required BusinessAccessRole role,
}) {
  return MyBusinessEntry(
    business: {'id': id, 'title': title},
    access: BusinessAccess(role: role, permissions: const []),
  );
}

Widget _profileHarness({
  required AuthNotifier auth,
  required List<MyBusinessEntry> entries,
  Locale locale = const Locale('ru'),
  MediaQueryData? mediaQuery,
}) {
  final screen = mediaQuery == null
      ? const ProfileScreen()
      : MediaQuery(data: mediaQuery, child: const ProfileScreen());

  return ProviderScope(
    overrides: [
      authProvider.overrideWith(() => auth),
      cityProvider.overrideWith(() => _UralskCityNotifier()),
      myBusinessEntriesProvider.overrideWith((ref) async => entries),
    ],
    child: wrapWithL10n(screen, locale: locale),
  );
}

void main() {
  group('Favorites remove UI.6B.1', () {
    testWidgets('success calls repository remove and FAVORITE_REMOVE analytics',
        (tester) async {
      final favoritesData = [_favoriteItem(businessId: 'b1', title: 'Uralsk Place')];
      final catalog = _RecordingCatalogRepository();
      final favoritesRepo = _RecordingFavoritesRepository((id) async {
        favoritesData.removeWhere(
          (item) => (item['business'] as Map)['id'] == id,
        );
      });

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedUserNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            favoritesRepositoryProvider.overrideWith((ref) => favoritesRepo),
            catalogRepositoryProvider.overrideWith((ref) => catalog),
            favoritesProvider.overrideWith((ref) async => List<Map<String, dynamic>>.from(favoritesData)),
          ],
          child: wrapWithL10n(const FavoritesScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Uralsk Place'), findsOneWidget);
      await tester.tap(
        find.bySemanticsLabel('Удалить Uralsk Place из избранного'),
      );
      await tester.pumpAndSettle();

      expect(favoritesRepo.removedIds, ['b1']);
      expect(catalog.trackedRemoveIds, ['b1']);
      expect(find.text('Uralsk Place'), findsNothing);

      await _disposeTrackedImpressionTimers(tester);
    });

    testWidgets('failure does not track analytics and shows localized error',
        (tester) async {
      final favoritesData = [_favoriteItem(businessId: 'b1', title: 'Uralsk Place')];
      final catalog = _RecordingCatalogRepository();
      final favoritesRepo = _RecordingFavoritesRepository((_) async {
        throw Exception('network');
      });

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedUserNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            favoritesRepositoryProvider.overrideWith((ref) => favoritesRepo),
            catalogRepositoryProvider.overrideWith((ref) => catalog),
            favoritesProvider.overrideWith((ref) async => List<Map<String, dynamic>>.from(favoritesData)),
          ],
          child: wrapWithL10n(const FavoritesScreen()),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(
        find.bySemanticsLabel('Удалить Uralsk Place из избранного'),
      );
      await tester.pumpAndSettle();

      expect(catalog.trackedRemoveIds, isEmpty);
      expect(
        find.text('Не удалось убрать из избранного. Попробуйте ещё раз.'),
        findsOneWidget,
      );
      expect(find.text('Uralsk Place'), findsOneWidget);
      expect(find.textContaining('Exception'), findsNothing);

      await _disposeTrackedImpressionTimers(tester);
    });
  });

  group('Profile membership UI.6B.1', () {
    testWidgets('OWNER with global USER shows business cabinet entry',
        (tester) async {
      await tester.pumpWidget(
        _profileHarness(
          auth: _AuthedUserNotifier(userRole: 'USER'),
          entries: [_entry(id: 'b1', title: 'Owner Cafe', role: BusinessAccessRole.owner)],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Test User'), findsOneWidget);
      await tester.scrollUntilVisible(
        find.text('Для бизнеса'),
        160,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.scrollUntilVisible(
        find.text('Owner Cafe'),
        160,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Мои бизнесы'), findsOneWidget);
      expect(find.text('Владелец'), findsOneWidget);
      expect(find.text('Модерация'), findsNothing);
    });

    testWidgets('MANAGER membership shown without moderation entry',
        (tester) async {
      await tester.pumpWidget(
        _profileHarness(
          auth: _AuthedUserNotifier(userRole: 'USER'),
          entries: [
            _entry(id: 'b2', title: 'Managed Bar', role: BusinessAccessRole.manager),
          ],
        ),
      );
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(
        find.text('Managed Bar'),
        160,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Менеджер'), findsOneWidget);
      expect(find.text('Модерация'), findsNothing);
    });

    testWidgets('authenticated profile 320 KK 2.0 baseline layout', (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 720));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        _profileHarness(
          auth: _AuthedUserNotifier(userRole: 'USER', avatarUrl: null),
          entries: const [],
          mediaQuery: const MediaQueryData(
            size: Size(320, 720),
            textScaler: TextScaler.linear(2.0),
          ),
          locale: const Locale('kk'),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('multiple businesses show distinct membership labels at 320 KK 2.0',
        (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 720));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        _profileHarness(
          auth: _AuthedUserNotifier(userRole: 'USER', avatarUrl: null),
          entries: [
            _entry(id: 'b1', title: 'Owner Spot', role: BusinessAccessRole.owner),
            _entry(id: 'b2', title: 'Managed Spot', role: BusinessAccessRole.manager),
          ],
          mediaQuery: const MediaQueryData(
            size: Size(320, 720),
            textScaler: TextScaler.linear(2.0),
          ),
          locale: const Locale('kk'),
        ),
      );
      await tester.pumpAndSettle();
      final layoutError = tester.takeException();
      expect(
        layoutError,
        isNull,
        reason: layoutError?.toString(),
      );

      await tester.scrollUntilVisible(
        find.text('Owner Spot'),
        200,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Owner Spot'), findsOneWidget);
      await tester.scrollUntilVisible(
        find.text('Managed Spot'),
        120,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Managed Spot'), findsOneWidget);
      expect(find.text('Иесі'), findsWidgets);
      expect(find.text('Менеджер'), findsWidgets);
    });

    testWidgets('USER without staff role does not see moderation', (tester) async {
      await tester.pumpWidget(
        _profileHarness(
          auth: _AuthedUserNotifier(userRole: 'USER'),
          entries: const [],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Модерация'), findsNothing);
    });

    testWidgets('avatar fallback uses initial when avatarUrl absent', (tester) async {
      await tester.pumpWidget(
        _profileHarness(
          auth: _AuthedUserNotifier(avatarUrl: null),
          entries: const [],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('T'), findsWidgets);
      expect(find.byType(Image), findsNothing);
    });
  });

  group('Logout UI.6B.1', () {
    testWidgets('confirm invokes logout', (tester) async {
      final auth = _AuthedUserNotifier();
      final router = GoRouter(
        initialLocation: '/profile',
        routes: [
          GoRoute(
            path: '/profile',
            builder: (_, __) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/home',
            builder: (_, __) => const Scaffold(body: Text('HOME')),
          ),
        ],
      );
      addTearDown(router.dispose);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => auth),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            myBusinessEntriesProvider.overrideWith((ref) async => const []),
          ],
          child: wrapRouterWithL10n(router),
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

      await tester.tap(
        find.descendant(
          of: find.byType(AlertDialog),
          matching: find.text('Выйти из аккаунта'),
        ).last,
      );
      await tester.pumpAndSettle();

      expect(auth.logoutInvoked, isTrue);
      expect(find.text('HOME'), findsOneWidget);
    });
  });

  group('Login auth matrix UI.6B.1', () {
    test('Google hidden when compile flag disabled', () {
      expect(AppConstants.googleAuthEnabled, isFalse);
    });

    testWidgets('Google button hidden in default test configuration',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
          ],
          child: wrapWithL10n(const LoginScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Войти через Google'), findsNothing);
    });

    testWidgets('Apple hidden on Android test platform even if flag were enabled',
        (tester) async {
      try {
        debugDefaultTargetPlatformOverride = TargetPlatform.android;
        expect(isAppleSignInPlatformSupported(), isFalse);

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authProvider.overrideWith(() => _GuestAuthNotifier()),
            ],
            child: wrapWithL10n(const LoginScreen()),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.byType(SignInWithAppleButton), findsNothing);
      } finally {
        debugDefaultTargetPlatformOverride = null;
      }
    });

    testWidgets('OTP reachable when social providers unavailable', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
          ],
          child: wrapWithL10n(const LoginScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(AppConstants.googleAuthEnabled, isFalse);
      expect(AppConstants.appleAuthEnabled, isFalse);
      expect(find.text('Получить код'), findsOneWidget);
      expect(find.text('Войти по телефону'), findsNothing);
    });

    test('DEV login requires ReleaseEnvironment.allowDevLogin and flag', () {
      expect(ReleaseEnvironment.allowDevLogin, isFalse);
      expect(AppConstants.devLoginEnabled, isFalse);
    });
  });

  group('Login redirect UI.6B.1', () {
    testWidgets('?redirect=/favorites wins over default /home after auth',
        (tester) async {
      final authGate = ValueNotifier(false);

      final router = GoRouter(
        refreshListenable: authGate,
        initialLocation: '/login?redirect=${Uri.encodeComponent('/favorites')}',
        redirect: (context, state) {
          if (!authGate.value) return null;
          if (state.matchedLocation == '/login') {
            final redirect = state.uri.queryParameters['redirect'];
            if (redirect != null && redirect.isNotEmpty) {
              return sanitizeLoginRedirect(redirect);
            }
            return '/home';
          }
          return null;
        },
        routes: [
          GoRoute(
            path: '/login',
            builder: (_, __) => const Scaffold(body: Text('LOGIN_SCREEN')),
          ),
          GoRoute(
            path: '/favorites',
            builder: (_, __) => const Scaffold(body: Text('Избранное')),
          ),
          GoRoute(
            path: '/home',
            builder: (_, __) => const Scaffold(body: Text('HOME_SCREEN')),
          ),
        ],
      );
      addTearDown(router.dispose);

      await tester.pumpWidget(wrapRouterWithL10n(router));
      await tester.pumpAndSettle();
      expect(find.text('LOGIN_SCREEN'), findsOneWidget);

      authGate.value = true;
      await tester.pumpAndSettle();

      expect(find.text('Избранное'), findsOneWidget);
      expect(find.text('HOME_SCREEN'), findsNothing);
    });

    test('sanitizeLoginRedirect preserves business detail return path', () {
      expect(
        sanitizeLoginRedirect('/business/b1?tab=reviews'),
        '/business/b1?tab=reviews',
      );
    });
  });
}
