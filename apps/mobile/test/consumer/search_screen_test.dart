import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/analytics/providers/analytics_identity_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/search/presentation/search_screen.dart';
import 'package:qalago_mobile/shared/models/models.dart';

import '../support/l10n_test_harness.dart';

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
          citiesProvider.overrideWith(
            (ref) async => [
              {'id': 'city-1', 'slug': 'uralsk', 'nameRu': 'Уральск'},
            ],
          ),
          analyticsVisitorIdProvider.overrideWith((ref) async => 'a' * 32),
        ],
        child: wrapRouterWithL10n(router),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Найдено: 1'), findsOneWidget);
    expect(find.text('Coffee House'), findsOneWidget);
    expect(find.text('VIP'), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('partial count when total exceeds loaded items', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _searchOverrides(
          businesses: PaginatedBusinesses(
            items: List.generate(
              50,
              (i) => BusinessModel(
                id: 'b$i',
                title: 'Biz $i',
                slug: 'biz-$i',
                address: 'A',
                categoryTitle: 'C',
                categoryId: 'cat1',
              ),
            ),
            total: 200,
          ),
        ),
        child: wrapWithL10n(const SearchScreen(initialQuery: 'food')),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Показано 50 из 200'), findsOneWidget);
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('category scope chip localized and clearable', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _searchOverrides(
          businesses: PaginatedBusinesses(items: [], total: 0),
        ),
        child: wrapWithL10n(const SearchScreen(categoryId: 'cat1')),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Кофейни'), findsWidgets);
    expect(find.byTooltip('Убрать фильтр категории'), findsOneWidget);
    await tester.tap(find.byTooltip('Убрать фильтр категории'));
    await tester.pumpAndSettle();
    expect(find.byTooltip('Убрать фильтр категории'), findsNothing);
  });

  testWidgets('unknown categoryId shows fallback not raw id', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _searchOverrides(
          businesses: PaginatedBusinesses(items: [], total: 0),
        ),
        child: wrapWithL10n(const SearchScreen(categoryId: 'unknown-cat-id')),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('unknown-cat-id'), findsNothing);
    expect(find.text('Категория'), findsOneWidget);
  });

  testWidgets('KK category scope label', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ..._searchOverrides(
            businesses: PaginatedBusinesses(items: [], total: 0),
          ),
          appLocaleCodeProvider.overrideWith((ref) => 'kk'),
        ],
        child: wrapWithL10n(
          const SearchScreen(categoryId: 'cat1'),
          locale: const Locale('kk'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Кофейнялар'), findsWidgets);
  });

  testWidgets('clear query preserves category scope', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _searchOverrides(
          businesses: PaginatedBusinesses(items: [], total: 0),
        ),
        child: wrapWithL10n(
          const SearchScreen(initialQuery: 'abc', categoryId: 'cat1'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.bySemanticsLabel('Очистить'));
    await tester.pumpAndSettle();
    expect(find.text('Кофейни'), findsWidgets);
    expect(find.text('abc'), findsNothing);
  });

  testWidgets('typing updates after debounce', (tester) async {
    BusinessesQuery? lastQuery;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _FixedCityNotifier()),
          categoriesProvider.overrideWith((ref) async => _sampleCategories()),
          businessesProvider.overrideWith((ref, query) async {
            lastQuery = query;
            return PaginatedBusinesses(items: [], total: 0);
          }),
          nearbySearchPositionProvider.overrideWith(
            (ref) => const UserPosition(latitude: 51.23, longitude: 51.38),
          ),
        ],
        child: wrapWithL10n(const SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'tea');
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pumpAndSettle();

    expect(lastQuery?.search, 'tea');
  });

  testWidgets('narrow filters empty state offers reset', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _searchOverrides(
          businesses: PaginatedBusinesses(items: [], total: 0),
        ),
        child: wrapWithL10n(
          const SearchScreen(
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
        overrides: _searchOverrides(
          businesses: PaginatedBusinesses(items: [], total: 0),
        ),
        child: wrapWithL10n(
          const SearchScreen(categoryId: 'cat1'),
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
        overrides: _searchOverrides(
          businesses: PaginatedBusinesses(items: [], total: 0),
        ),
        child: wrapWithL10n(
          const SearchScreen(initialQuery: 'кофе'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Весь город'), findsOneWidget);
  });

  testWidgets('invalid radiusKm falls back to whole city label', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _searchOverrides(
          businesses: PaginatedBusinesses(items: [], total: 0),
        ),
        child: wrapWithL10n(
          const SearchScreen(initialQuery: 'x', initialRadiusKm: '99'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Весь город'), findsOneWidget);
  });

  testWidgets('start state for whitespace-only query', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _searchOverrides(
          businesses: PaginatedBusinesses(items: [], total: 0),
        ),
        child: wrapWithL10n(const SearchScreen(initialQuery: '   ')),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Найдите место или услугу'), findsOneWidget);
  });

  testWidgets('retains query after business pop', (tester) async {
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/search',
          builder: (context, state) => SearchScreen(
            initialQuery: state.uri.queryParameters['q'],
          ),
        ),
        GoRoute(
          path: '/business/:id',
          builder: (context, state) => Scaffold(
            appBar: AppBar(
              leading: BackButton(onPressed: () => context.pop()),
            ),
            body: const Center(child: Text('Detail')),
          ),
        ),
      ],
      initialLocation: '/search?q=keep',
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: _searchOverrides(
          businesses: PaginatedBusinesses(
            items: [
              BusinessModel(
                id: 'b1',
                title: 'Keep Biz',
                slug: 'keep',
                address: 'A',
                categoryTitle: 'C',
                categoryId: 'cat1',
              ),
            ],
            total: 1,
          ),
        ),
        child: wrapRouterWithL10n(router),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Keep Biz'));
    await tester.pumpAndSettle();
    expect(find.text('Detail'), findsOneWidget);

    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.text('Keep Biz'), findsOneWidget);
    final field = tester.widget<TextField>(find.byType(TextField));
    expect(field.controller?.text, 'keep');
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });
}

List<Override> _searchOverrides({required PaginatedBusinesses businesses}) {
  return [
    cityProvider.overrideWith(() => _FixedCityNotifier()),
    categoriesProvider.overrideWith((ref) async => _sampleCategories()),
    businessesProvider.overrideWith((ref, query) async => businesses),
    nearbySearchPositionProvider.overrideWith(
      (ref) => const UserPosition(latitude: 51.23, longitude: 51.38),
    ),
  ];
}

List<CategoryModel> _sampleCategories() => [
      CategoryModel(
        id: 'cat1',
        title: 'Кофейни',
        nameRu: 'Кофейни',
        nameKk: 'Кофейнялар',
        slug: 'coffee',
      ),
      CategoryModel(
        id: 'cat2',
        title: 'Рестораны',
        nameRu: 'Рестораны',
        nameKk: 'Мейрамханалар',
        slug: 'restaurants',
      ),
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
