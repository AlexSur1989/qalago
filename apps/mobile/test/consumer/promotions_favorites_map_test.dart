import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart' as fm;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/auth/route_access.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/features/favorites/presentation/favorites_screen.dart';
import 'package:qalago_mobile/features/map/presentation/map_screen.dart';
import 'package:qalago_mobile/features/promotions/presentation/promotions_screen.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  group('public routes', () {
    test('promotions and map accessible as guest', () {
      expect(isPublicConsumerRoute('/promotions'), isTrue);
      expect(isPublicConsumerRoute('/map'), isTrue);
      expect(isPublicConsumerRoute('/favorites'), isTrue);
    });

    test('all discovery surfaces use canonical business route', () {
      expect(isPublicConsumerRoute('/business/b1'), isTrue);
    });
  });

  group('promotions screen', () {
    testWidgets('guest can open promotions', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            categoriesProvider.overrideWith((ref) async => []),
            promotionsProvider.overrideWith((ref) async {
              return PaginatedPromotions(
                items: [
                  PromotionModel(
                    id: 'p1',
                    title: 'Скидка 20%',
                    description: 'На всё меню',
                    business: BusinessModel(
                      id: 'b1',
                      title: 'Coffee House',
                      slug: 'coffee',
                      address: 'Street 1',
                    ),
                  ),
                ],
              );
            }),
          ],
          child: const MaterialApp(home: PromotionsScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Акции'), findsOneWidget);
      expect(find.text('Coffee House'), findsOneWidget);
      expect(find.text('Скидка 20%'), findsOneWidget);
    });

    testWidgets('empty promotions in city shows city-specific copy', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            categoriesProvider.overrideWith((ref) async => []),
            promotionsProvider.overrideWith((ref) async {
              return PaginatedPromotions(items: []);
            }),
          ],
          child: const MaterialApp(home: PromotionsScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('В Уральск пока нет активных акций'), findsOneWidget);
    });

    testWidgets('promotions API error shows retry', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            categoriesProvider.overrideWith(
              (ref) async => throw Exception('skip'),
            ),
            promotionsProvider.overrideWith((ref) async {
              throw Exception('network');
            }),
          ],
          child: const MaterialApp(home: PromotionsScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Не удалось загрузить акции'), findsOneWidget);
      expect(find.text('Повторить'), findsOneWidget);
    });

    testWidgets('expired promotion excluded from list', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            categoriesProvider.overrideWith((ref) async => []),
            promotionsProvider.overrideWith((ref) async {
              return PaginatedPromotions(
                items: [
                  PromotionModel(
                    id: 'expired',
                    title: 'Old promo',
                    endDate: DateTime.now().toUtc().subtract(
                      const Duration(days: 2),
                    ),
                    business: BusinessModel(
                      id: 'b-old',
                      title: 'Old Place',
                      slug: 'old',
                      address: 'A',
                    ),
                  ),
                ],
              );
            }),
          ],
          child: const MaterialApp(home: PromotionsScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Old promo'), findsNothing);
      expect(find.textContaining('активных акций'), findsOneWidget);
    });

    test('PROMOTION_VIEW analytics failure does not throw', () async {
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
      final repo = CatalogRepository(dio);
      await expectLater(repo.trackPromotionView('b1'), completes);
    });
  });

  group('favorites screen', () {
    testWidgets('authenticated favorites filtered by city', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            favoritesProvider.overrideWith((ref) async {
              return [
                {
                  'id': 'f1',
                  'createdAt': '2026-09-01T00:00:00.000Z',
                  'business': {
                    'id': 'b1',
                    'title': 'Uralsk Place',
                    'slug': 'uralsk',
                    'address': 'A',
                    'category': {'title': 'Кафе'},
                    'city': {'slug': 'uralsk', 'nameRu': 'Уральск'},
                  },
                },
                {
                  'id': 'f2',
                  'createdAt': '2026-08-01T00:00:00.000Z',
                  'business': {
                    'id': 'b2',
                    'title': 'Aktobe Place',
                    'slug': 'aktobe',
                    'address': 'B',
                    'category': {'title': 'Магазин'},
                    'city': {'slug': 'aktobe', 'nameRu': 'Актобе'},
                  },
                },
              ];
            }),
          ],
          child: const MaterialApp(home: FavoritesScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Uralsk Place'), findsOneWidget);
      expect(find.text('Aktobe Place'), findsNothing);
      expect(find.text('VIP'), findsNothing);
    });

    testWidgets('no favorites in selected city shows city copy', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            favoritesProvider.overrideWith((ref) async {
              return [
                {
                  'id': 'f2',
                  'createdAt': '2026-08-01T00:00:00.000Z',
                  'business': {
                    'id': 'b2',
                    'title': 'Aktobe Place',
                    'slug': 'aktobe',
                    'address': 'B',
                    'city': {'slug': 'aktobe', 'nameRu': 'Актобе'},
                  },
                },
              ];
            }),
          ],
          child: const MaterialApp(home: FavoritesScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('В Уральск пока нет избранных мест'), findsOneWidget);
    });

    testWidgets('no favorites at all shows empty copy', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            favoritesProvider.overrideWith((ref) async => []),
          ],
          child: const MaterialApp(home: FavoritesScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('У вас пока нет избранных мест'), findsOneWidget);
    });

    testWidgets('name sort option is available', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _AuthedAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            favoritesProvider.overrideWith((ref) async {
              return [
                {
                  'id': 'f1',
                  'createdAt': '2026-09-01T00:00:00.000Z',
                  'business': {
                    'id': 'b1',
                    'title': 'Z Place',
                    'slug': 'z',
                    'address': 'A',
                    'city': {'slug': 'uralsk'},
                  },
                },
                {
                  'id': 'f2',
                  'createdAt': '2026-08-01T00:00:00.000Z',
                  'business': {
                    'id': 'b2',
                    'title': 'A Place',
                    'slug': 'a',
                    'address': 'B',
                    'city': {'slug': 'uralsk'},
                  },
                },
              ];
            }),
          ],
          child: const MaterialApp(home: FavoritesScreen()),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Недавние'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('По названию').last);
      await tester.pumpAndSettle();

      final aFinder = find.text('A Place');
      final zFinder = find.text('Z Place');
      expect(tester.getTopLeft(aFinder).dy < tester.getTopLeft(zFinder).dy, isTrue);
    });
  });

  group('map screen', () {
    testWidgets('guest can open map with markers', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            mapBusinessesProvider.overrideWith((ref) async {
              return PaginatedBusinesses(
                items: [
                  BusinessModel(
                    id: 'b1',
                    title: 'Map Cafe',
                    slug: 'map-cafe',
                    address: 'Street 1',
                    latitude: 51.23,
                    longitude: 51.38,
                    categoryTitle: 'Кафе',
                  ),
                ],
                total: 1,
              );
            }),
          ],
          child: const MaterialApp(home: MapScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Заведения на карте'), findsOneWidget);
      expect(find.text('Map Cafe'), findsOneWidget);
      expect(find.text('VIP'), findsNothing);
    });

    testWidgets('map error shows retry banner without removing map', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            mapBusinessesProvider.overrideWith((ref) async {
              throw Exception('network');
            }),
          ],
          child: const MaterialApp(home: MapScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Не удалось загрузить заведения'), findsOneWidget);
      expect(find.text('Повторить'), findsOneWidget);
      expect(find.byType(fm.FlutterMap), findsOneWidget);
    });

    testWidgets('marker tap shows preview with Подробнее', (tester) async {
      final router = GoRouter(
        routes: [
          GoRoute(path: '/', builder: (_, _) => const MapScreen()),
          GoRoute(
            path: '/business/:id',
            builder: (_, state) =>
                Scaffold(body: Text('Detail ${state.pathParameters['id']}')),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            mapBusinessesProvider.overrideWith((ref) async {
              return PaginatedBusinesses(
                items: [
                  BusinessModel(
                    id: 'b1',
                    title: 'Map Cafe',
                    slug: 'map-cafe',
                    address: 'Street 1',
                    latitude: 51.23,
                    longitude: 51.38,
                    categoryTitle: 'Кафе',
                  ),
                ],
                total: 1,
              );
            }),
          ],
          child: MaterialApp.router(routerConfig: router),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Map Cafe'));
      await tester.pumpAndSettle();

      expect(find.text('Подробнее'), findsOneWidget);

      await tester.tap(find.text('Подробнее'));
      await tester.pumpAndSettle();

      expect(find.text('Detail b1'), findsOneWidget);
    });

    testWidgets('business without coordinates is skipped safely', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
            cityProvider.overrideWith(() => _UralskCityNotifier()),
            userLocationProvider.overrideWith((ref) => Stream.value(null)),
            mapBusinessesProvider.overrideWith((ref) async {
              return PaginatedBusinesses(
                items: [
                  BusinessModel(
                    id: 'b-no-coords',
                    title: 'Hidden Marker',
                    slug: 'hidden',
                    address: 'Street',
                  ),
                ],
                total: 1,
              );
            }),
          ],
          child: const MaterialApp(home: MapScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Hidden Marker'), findsNothing);
      expect(find.text('Нет заведений с координатами'), findsOneWidget);
    });
  });

  group('city propagation', () {
    test('promotions provider uses selected city slug', () {
      String? capturedSlug;
      final container = ProviderContainer(
        overrides: [
          cityProvider.overrideWith(() => _UralskCityNotifier()),
          catalogRepositoryProvider.overrideWith(
            (ref) => _CapturingCatalogRepository(
              onPromotions: (slug) => capturedSlug = slug,
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      container.read(promotionsProvider.future);
      expect(capturedSlug, 'uralsk');
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
          phone: '+77001234567',
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

class _CapturingCatalogRepository extends CatalogRepository {
  _CapturingCatalogRepository({required this.onPromotions}) : super(Dio());

  final void Function(String citySlug) onPromotions;

  @override
  Future<PaginatedPromotions> fetchPromotions({
    required String citySlug,
    bool activeNow = true,
  }) async {
    onPromotions(citySlug);
    return PaginatedPromotions(items: []);
  }
}
