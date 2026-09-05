import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/search/presentation/search_screen.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  testWidgets('search works as guest with initial query', (tester) async {
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/search',
          builder: (context, state) => SearchScreen(
            initialQuery: state.uri.queryParameters['q'],
            categoryId: state.uri.queryParameters['categoryId'],
            initialRadiusKm: state.uri.queryParameters['radiusKm'],
          ),
        ),
      ],
      initialLocation: '/search?q=кофе',
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          categoriesProvider.overrideWith((ref) async => _sampleCategories()),
          businessesProvider.overrideWith((ref, query) async {
            return PaginatedBusinesses(
              items: [
                BusinessModel(
                  id: 'b1',
                  title: 'Coffee House',
                  slug: 'coffee-house',
                  address: 'Street 1',
                  categoryTitle: 'Кофейни',
                  categoryId: 'cat1',
                ),
              ],
              total: 1,
            );
          }),
          nearbySearchPositionProvider.overrideWith(
            (ref) => const UserPosition(latitude: 51.23, longitude: 51.38),
          ),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Найдено: 1'), findsOneWidget);
    expect(find.text('Coffee House'), findsOneWidget);
    expect(find.text('VIP'), findsNothing);
  });

  testWidgets('narrow filters empty state offers reset', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          categoriesProvider.overrideWith((ref) async => _sampleCategories()),
          businessesProvider.overrideWith((ref, query) async {
            return PaginatedBusinesses(items: [], total: 0);
          }),
          nearbySearchPositionProvider.overrideWith(
            (ref) => const UserPosition(latitude: 51.23, longitude: 51.38),
          ),
        ],
        child: const MaterialApp(
          home: SearchScreen(
            initialQuery: 'xyz-none',
            initialRadiusKm: '5',
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Сбросить фильтры'), findsOneWidget);
  });

  testWidgets('category chip selection visible', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          categoriesProvider.overrideWith((ref) async => _sampleCategories()),
          businessesProvider.overrideWith((ref, query) async {
            return PaginatedBusinesses(items: [], total: 0);
          }),
          nearbySearchPositionProvider.overrideWith(
            (ref) => const UserPosition(latitude: 51.23, longitude: 51.38),
          ),
        ],
        child: const MaterialApp(
          home: SearchScreen(categoryId: 'cat1'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Кофейни'), findsWidgets);
    expect(find.text('Все категории'), findsOneWidget);
  });

  testWidgets('whole city radius chip is selected by default', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          categoriesProvider.overrideWith((ref) async => _sampleCategories()),
          businessesProvider.overrideWith((ref, query) async {
            return PaginatedBusinesses(items: [], total: 0);
          }),
          nearbySearchPositionProvider.overrideWith(
            (ref) => const UserPosition(latitude: 51.23, longitude: 51.38),
          ),
        ],
        child: const MaterialApp(
          home: SearchScreen(initialQuery: 'кофе'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Весь город'), findsOneWidget);
  });
}

List<CategoryModel> _sampleCategories() => [
      CategoryModel(id: 'cat1', title: 'Кофейни', slug: 'coffee'),
      CategoryModel(id: 'cat2', title: 'Рестораны', slug: 'restaurants'),
    ];

class _FixedCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        launchStatus: 'LIVE',
        centerLat: 51.2278,
        centerLng: 51.3865,
      );
}
