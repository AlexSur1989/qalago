import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/ads/providers/ad_serve_provider.dart';
import 'package:qalago_mobile/features/auth/presentation/login_screen.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/home/presentation/sections/home_popular_section.dart';
import 'package:qalago_mobile/features/home/presentation/sections/home_promotions_section.dart';
import 'package:qalago_mobile/features/home/providers/home_organic_recommendations_provider.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/utils/auth_utils.dart';

import '../support/l10n_test_harness.dart';

Future<void> _pumpResponsive(
  WidgetTester tester,
  Widget child, {
  Locale locale = const Locale('ru'),
  double width = 320,
  TextScaler textScaler = TextScaler.noScaling,
}) async {
  tester.view.physicalSize = Size(width, 900);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.binding.setSurfaceSize(Size(width, 900));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  await tester.pumpWidget(
    MediaQuery(
      data: MediaQueryData(
        size: Size(width, 900),
        textScaler: textScaler,
      ),
      child: wrapWithL10n(child, locale: locale),
    ),
  );
  await tester.pumpAndSettle();
  expect(tester.takeException(), isNull);
}

PromotionModel _longPromotion({required String titleRu, String? titleKk}) {
  return PromotionModel(
    id: 'p-long',
    title: titleRu,
    titleKk: titleKk,
    description:
        'Очень длинное описание акции с дополнительными условиями и подробностями для проверки верстки',
    descriptionKk:
        'Өте ұзақ сипаттама акцияның толық шарттарымен бірге көрсетіледі',
    business: BusinessModel(
      id: 'b-promo',
      title: 'Кофейня с очень длинным названием заведения в Уральске',
      slug: 'long-cafe',
      address: 'Abay 1',
    ),
  );
}

void main() {
  group('UI.8B — Home promotions overflow', () {
    testWidgets('long RU content at 320 1.0', (tester) async {
      await _pumpResponsive(
        tester,
        ProviderScope(
          overrides: [
            cityProvider.overrideWith(() => _CityNotifier()),
            promotionsProvider.overrideWith(
              (ref) async => PaginatedPromotions(
                items: [
                  _longPromotion(
                    titleRu:
                        'Скидка на всё меню до конца месяца и дополнительный бонус',
                  ),
                ],
              ),
            ),
            homePromotionsAdsProvider.overrideWith((ref) async => const []),
          ],
          child: HomePromotionsSection(
            onOrganicPromotionTap: (_) {},
            onPaidPromotionTap: (_) {},
          ),
        ),
      );
      expect(find.textContaining('Скидка на всё меню'), findsOneWidget);
    });

    testWidgets('long KK content at 320 textScale 2.0', (tester) async {
      await _pumpResponsive(
        tester,
        ProviderScope(
          overrides: [
            cityProvider.overrideWith(() => _CityNotifier()),
            promotionsProvider.overrideWith(
              (ref) async => PaginatedPromotions(
                items: [
                  _longPromotion(
                    titleRu: 'Promo RU fallback',
                    titleKk:
                        'Барлық тағамдарға ұзақ акция атауы мен қосымша бонус',
                  ),
                ],
              ),
            ),
            homePromotionsAdsProvider.overrideWith((ref) async => const []),
          ],
          child: HomePromotionsSection(
            onOrganicPromotionTap: (_) {},
            onPaidPromotionTap: (_) {},
          ),
        ),
        locale: const Locale('kk'),
        textScaler: const TextScaler.linear(2.0),
      );
      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.text(l10n.homePromotionsSection), findsOneWidget);
    });
  });

  group('UI.8B — Home popular overflow', () {
    testWidgets('long business at 320 KK 2.0', (tester) async {
      final business = BusinessModel(
        id: 'pop-long',
        title:
            'Ресторан с очень длинным названием заведения в центре города',
        slug: 'pop-long',
        address: 'Address line',
        categoryTitle: 'Кафе',
      );
      await _pumpResponsive(
        tester,
        ProviderScope(
          overrides: [
            cityProvider.overrideWith(() => _CityNotifier()),
            homeOrganicRecommendationsProvider.overrideWith(
              (ref) async => [
                RecommendedBusiness(
                  business: business,
                  reason: 'Популярно сейчас среди посетителей города',
                ),
              ],
            ),
          ],
          child: const HomePopularSection(),
        ),
        locale: const Locale('kk'),
        textScaler: const TextScaler.linear(2.0),
      );
      expect(find.textContaining('Ресторан с очень'), findsOneWidget);
      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pump(const Duration(milliseconds: 700));
    });
  });

  group('UI.8B — post-login navigation', () {
    test('resolvePostLoginRoute honors redirect', () {
      expect(
        resolvePostLoginRoute(redirectQuery: '/profile'),
        '/profile',
      );
      expect(
        resolvePostLoginRoute(redirectQuery: '/favorites'),
        '/favorites',
      );
    });

    test('resolvePostLoginRoute rejects unsafe redirect', () {
      expect(
        resolvePostLoginRoute(redirectQuery: 'https://evil.com'),
        '/home',
      );
    });

    test('resolvePostLoginRoute does not auto-route to owner', () {
      expect(resolvePostLoginRoute(redirectQuery: null), '/home');
      expect(resolvePostLoginRoute(redirectQuery: ''), '/home');
    });

    testWidgets('LoginScreen navigates to profile redirect after auth',
        (tester) async {
      final router = GoRouter(
        initialLocation: '/login?redirect=${Uri.encodeComponent('/profile')}',
        routes: [
          GoRoute(
            path: '/login',
            builder: (_, __) => const LoginScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (_, __) => const Scaffold(body: Text('PROFILE_OK')),
          ),
          GoRoute(
            path: '/owner',
            builder: (_, __) => const Scaffold(body: Text('OWNER_CABINET')),
          ),
        ],
      );
      addTearDown(router.dispose);

      late _ControllableAuthNotifier authNotifier;
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() {
              authNotifier = _ControllableAuthNotifier();
              return authNotifier;
            }),
          ],
          child: wrapRouterWithL10n(router),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(LoginScreen), findsOneWidget);

      authNotifier.signInAsOwner();
      await tester.pumpAndSettle();

      expect(find.text('PROFILE_OK'), findsOneWidget);
      expect(find.text('OWNER_CABINET'), findsNothing);
      expect(find.byType(LoginScreen), findsNothing);
    });

    testWidgets('Login with favorites redirect lands on favorites', (tester) async {
      final authGate = ValueNotifier(false);

      final router = GoRouter(
        refreshListenable: authGate,
        initialLocation: '/login?redirect=${Uri.encodeComponent('/favorites')}',
        redirect: (context, state) {
          if (!authGate.value) return null;
          if (state.matchedLocation == '/login') {
            return resolvePostLoginRoute(
              redirectQuery: state.uri.queryParameters['redirect'],
            );
          }
          return null;
        },
        routes: [
          GoRoute(
            path: '/login',
            builder: (_, __) => const Scaffold(body: Text('LOGIN')),
          ),
          GoRoute(
            path: '/favorites',
            builder: (_, __) => const Scaffold(body: Text('FAVORITES_SCREEN')),
          ),
        ],
      );
      addTearDown(router.dispose);

      await tester.pumpWidget(wrapRouterWithL10n(router));
      await tester.pumpAndSettle();
      authGate.value = true;
      await tester.pumpAndSettle();
      expect(find.text('FAVORITES_SCREEN'), findsOneWidget);
    });
  });
}

class _ControllableAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);

  void signInAsOwner() {
    state = AuthState(
      isAuthenticated: true,
      user: UserModel(
        id: 'u1',
        phone: '+77001234567',
        role: 'OWNER',
      ),
    );
  }
}

class _CityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(slug: 'uralsk', nameRu: 'Уральск');
}
