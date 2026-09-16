import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/auth/auth_prompt.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/providers/city_catalog_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/ads/providers/ad_serve_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/analytics/providers/analytics_identity_provider.dart';
import 'package:qalago_mobile/features/businesses/presentation/business_details_screen.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/features/categories/presentation/categories_screen.dart';
import 'package:qalago_mobile/features/categories/presentation/category_businesses_screen.dart';
import 'package:qalago_mobile/features/categories/presentation/category_subcategory_filter.dart';
import 'package:qalago_mobile/features/favorites/presentation/favorites_screen.dart';
import 'package:qalago_mobile/features/map/presentation/map_screen.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_city_screen.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_edit_screen.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_permissions_screen.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_reviews_screen.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:dio/dio.dart';

import '../support/l10n_test_harness.dart';

Future<void> _disposeTimers(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump(const Duration(milliseconds: 700));
}

Future<void> _pumpResponsiveShell(
  WidgetTester tester,
  Widget child, {
  Locale locale = const Locale('kk'),
  double width = 320,
  TextScaler textScaler = const TextScaler.linear(2.0),
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

BusinessModel _mapBusiness() => BusinessModel(
      id: 'b-map',
      title: 'Map Cafe',
      slug: 'map-cafe',
      address: 'Street 1',
      latitude: 51.23,
      longitude: 51.38,
      categoryTitle: 'Кафе',
      phone: '+77001234567',
      whatsapp: '77001234567',
    );

CategoryModel _longKkCategory() => CategoryModel(
      id: 'c-long',
      title: 'Long category',
      nameRu: 'Длинная категория',
      nameKk: 'Өте ұзақ санат атауы мысалы',
      slug: 'long-cat',
    );

void main() {
  group('Map — UI.7B', () {
    testWidgets('320 KK textScale 2.0 header and sheet avoid overflow', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(
              () => _UralskCityNotifier(),
            ),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            mapBusinessesProvider.overrideWith((ref) async {
              return PaginatedBusinesses(items: [_mapBusiness()], total: 1);
            }),
          ],
          child: const MapScreen(),
        ),
      );
      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.text(l10n.mapBusinessesOnMap), findsOneWidget);
      await _disposeTimers(tester);
    });

    testWidgets('header notifications expose localized tooltip', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            mapBusinessesProvider.overrideWith(
              (ref) async => PaginatedBusinesses(items: const [], total: 0),
            ),
          ],
          child: const MapScreen(),
        ),
        textScaler: TextScaler.noScaling,
      );
      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.byTooltip(l10n.homeNotificationsTooltip), findsOneWidget);
      await _disposeTimers(tester);
    });

    testWidgets('business marker exposes business title to semantics', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            mapBusinessesProvider.overrideWith((ref) async {
              return PaginatedBusinesses(items: [_mapBusiness()], total: 1);
            }),
          ],
          child: const MapScreen(),
        ),
        textScaler: TextScaler.noScaling,
      );

      expect(find.bySemanticsLabel('Map Cafe'), findsWidgets);
      await tester.tap(find.text('Map Cafe'));
      await tester.pumpAndSettle();

      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.text(l10n.mapDetails), findsOneWidget);
      await _disposeTimers(tester);
    });

    testWidgets('preview actions at 320 KK 2.0 avoid overflow', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            mapBusinessesProvider.overrideWith((ref) async {
              return PaginatedBusinesses(items: [_mapBusiness()], total: 1);
            }),
          ],
          child: const MapScreen(),
        ),
      );

      await tester.tap(find.text('Map Cafe'));
      await tester.pumpAndSettle();
      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.text(l10n.mapDetails), findsOneWidget);
      expect(tester.takeException(), isNull);
      await _disposeTimers(tester);
    });
  });

  group('Business Detail hero — UI.7B', () {
    testWidgets('hero icon actions expose localized tooltips', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            catalogRepositoryProvider.overrideWith(
              (ref) => _DetailTestCatalogRepository(),
            ),
            businessDetailsProvider.overrideWith(
              (ref, id) async => _fullIntentFixture(),
            ),
            businessFavoriteProvider.overrideWith((ref, id) async => false),
            myBusinessesProvider.overrideWith((ref) async => const []),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            analyticsSessionIdProvider.overrideWith((ref) => 'test-session-id'),
            analyticsVisitorIdProvider.overrideWith(
              (ref) async => 'a' * 32,
            ),
          ],
          child: const BusinessDetailsScreen(id: _businessId),
        ),
        locale: const Locale('kk'),
        textScaler: TextScaler.noScaling,
      );

      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.byTooltip(l10n.commonBack), findsOneWidget);
      expect(find.byTooltip(l10n.businessFavoriteAddTooltip), findsOneWidget);
      await _disposeTimers(tester);
    });
  });

  group('Categories — UI.7B', () {
    testWidgets('320 KK textScale 2.0 directory avoids overflow', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            cityCatalogTotalProvider.overrideWith((ref) async => 10),
            appLocaleCodeProvider.overrideWith((ref) => 'kk'),
            categoriesProvider.overrideWith(
              (ref) async => List.generate(6, (i) => _longKkCategory()),
            ),
            unreadNotificationsProvider.overrideWith((ref) async => 0),
          ],
          child: const CategoriesScreen(),
        ),
      );
      expect(find.byKey(const Key('categories_directory_grid')), findsOneWidget);
      expect(find.text('Өте ұзақ санат атауы мысалы'), findsWidgets);
      await _disposeTimers(tester);
    });

    testWidgets('category businesses 320 KK 2.0 layout', (tester) async {
      final biz = BusinessModel(
        id: 'b1',
        title: 'Organic Cafe',
        slug: 'organic',
        address: 'Addr',
      );
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            categoriesProvider.overrideWith((ref) async => [_longKkCategory()]),
            categorySubcategoriesProvider('c-long').overrideWith(
              (ref) async => [
                SubcategoryModel(
                  id: 's1',
                  categoryId: 'c-long',
                  slug: 'sub1',
                  nameRu: 'Sub',
                  nameKk: 'Өте ұзақ ішкі санат атауы',
                ),
              ],
            ),
            categoryBusinessesProvider.overrideWith(
              (ref, query) async => PaginatedBusinesses(items: [biz], total: 1),
            ),
            categoryRecommendedProvider.overrideWith((ref, query) async => [biz]),
            serveAdsProvider.overrideWith((ref, scope) async => const []),
          ],
          child: const CategoryBusinessesScreen(
            categoryId: 'c-long',
            categoryTitle: 'Өте ұзақ санат атауы мысалы',
          ),
        ),
      );
      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.text(l10n.categoryAllBusinesses), findsOneWidget);
      await _disposeTimers(tester);
    });
  });

  group('Auth required dialog — UI.7B', () {
    testWidgets('320 KK textScale 2.0 dialog fits with scrollable content',
        (tester) async {
      final router = GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => Scaffold(
              body: FilledButton(
                onPressed: () {
                  final l10n = lookupAppLocalizations(const Locale('kk'));
                  showAuthRequiredDialog(
                    context,
                    title: l10n.favoritesGuestTitle,
                    message: l10n.favoritesGuestBody,
                  );
                },
                child: const Text('open'),
              ),
            ),
          ),
        ],
      );

      await _pumpResponsiveShell(
        tester,
        ProviderScope(child: wrapRouterWithL10n(router, locale: const Locale('kk'))),
      );
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.text(l10n.commonLogin), findsOneWidget);
      expect(find.text(l10n.commonLater), findsOneWidget);
      expect(tester.takeException(), isNull);
      await _disposeTimers(tester);
    });
  });

  group('Profile subroutes — UI.7B', () {
    testWidgets('profile edit 320 KK 2.0', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedProfileUser()),
          ],
          child: const ProfileEditScreen(),
        ),
        width: 320,
      );
      final l10n = lookupAppLocalizations(const Locale('kk'));
      await tester.scrollUntilVisible(
        find.text(l10n.commonSave),
        120,
        scrollable: find.byType(Scrollable).first,
      );
      expect(tester.takeException(), isNull);
      await _disposeTimers(tester);
    });

    testWidgets('profile permissions 320 KK 2.0', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedProfileUser()),
          ],
          child: const ProfilePermissionsScreen(),
        ),
      );
      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.text(l10n.profilePermissions), findsOneWidget);
      await _disposeTimers(tester);
    });

    testWidgets('profile city 320 KK 2.0', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedProfileUser()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            citiesProvider.overrideWith(
              (ref) async => [
                {
                  'id': '1',
                  'slug': 'uralsk',
                  'nameRu': 'Уральск',
                  'nameKk': 'Орал',
                  'launchStatus': 'LIVE',
                },
              ],
            ),
          ],
          child: const ProfileCityScreen(),
        ),
      );
      expect(find.text('Уральск'), findsOneWidget);
      await _disposeTimers(tester);
    });

    testWidgets('profile reviews empty 320 KK 2.0', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedProfileUser()),
            myReviewsProvider.overrideWith((ref) async => const []),
          ],
          child: const ProfileReviewsScreen(),
        ),
      );
      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.text(l10n.profileReviewsEmpty), findsOneWidget);
      await _disposeTimers(tester);
    });
  });

  group('Favorites accessibility — UI.7B', () {
    testWidgets('sort control and notifications tooltips', (tester) async {
      await _pumpResponsiveShell(
        tester,
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedProfileUser()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            favoritesProvider.overrideWith((ref) async {
              return [
                {
                  'id': 'f1',
                  'createdAt': '2026-09-01T00:00:00.000Z',
                  'business': {
                    'id': 'b1',
                    'title': 'Place',
                    'slug': 'p',
                    'address': 'A',
                    'city': {'slug': 'uralsk'},
                  },
                },
              ];
            }),
          ],
          child: const FavoritesScreen(),
        ),
        textScaler: TextScaler.noScaling,
      );
      final l10n = lookupAppLocalizations(const Locale('kk'));
      expect(find.byTooltip(l10n.homeNotificationsTooltip), findsOneWidget);
      expect(find.text(l10n.favoritesSortLabel), findsOneWidget);
      await _disposeTimers(tester);
    });
  });
}

const _businessId = 'detail-test-biz';

Map<String, dynamic> _fullIntentFixture() => {
      'id': _businessId,
      'title': 'QalaGo Demo Cafe',
      'address': 'Abay Avenue 10, Uralsk',
      'phone': '+77001234567',
      'whatsapp': '77001234567',
      'latitude': 51.2278,
      'longitude': 51.3865,
      'category': {'title': 'Кофейни'},
      'city': {
        'nameRu': 'Уральск',
        'nameKk': 'Орал',
        'timezone': 'Asia/Oral',
      },
      'reviewsPreview': {'items': [], 'totalCount': 0},
    };

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        nameKk: 'Орал',
        launchStatus: 'LIVE',
        centerLat: 51.23,
        centerLng: 51.38,
      );
}

class _DetailTestCatalogRepository extends CatalogRepository {
  _DetailTestCatalogRepository() : super(Dio(BaseOptions(baseUrl: 'http://test')));
}

class _AuthedProfileUser extends AuthNotifier {
  @override
  AuthState build() => AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: UserModel(
          id: 'u1',
          phone: '+77001234567',
          role: 'USER',
          name: 'Test User',
        ),
      );
}
