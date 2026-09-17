import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/analytics/providers/analytics_identity_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/search/presentation/search_screen.dart';
import 'package:qalago_mobile/features/search/search_recent_history_provider.dart';
import 'package:qalago_mobile/features/search/search_taxonomy_provider.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import '../support/l10n_test_harness.dart';

void main() {
  testWidgets('no history shows initial neutral state', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _baseOverrides(history: const []),
        child: wrapWithL10n(const SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Найдите место или услугу'), findsOneWidget);
    expect(find.text('Недавние запросы'), findsNothing);
  });

  testWidgets('recent history visible when stored locally', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _baseOverrides(history: const ['маникюр', 'кафе']),
        child: wrapWithL10n(const SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Недавние запросы'), findsOneWidget);
    expect(find.text('маникюр'), findsOneWidget);
    expect(find.text('Найдите место или услугу'), findsNothing);
  });

  testWidgets('clear history removes section', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _baseOverrides(history: const ['маникюр']),
        child: wrapWithL10n(const SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Очистить'));
    await tester.pumpAndSettle();
    expect(find.text('Недавние запросы'), findsNothing);
    expect(find.text('Найдите место или услугу'), findsOneWidget);
  });

  testWidgets('selecting recent query executes search', (tester) async {
    var lastSearch = '';
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ..._baseOverrides(history: const ['маникюр']),
          businessesProvider.overrideWith((ref, query) async {
            lastSearch = query.search ?? '';
            return PaginatedBusinesses(
              items: [
                BusinessModel(
                  id: 'b1',
                  title: 'Salon',
                  slug: 'salon',
                  address: 'A',
                  categoryTitle: 'C',
                  categoryId: 'cat1',
                ),
              ],
              total: 1,
            );
          }),
        ],
        child: wrapWithL10n(const SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('маникюр'));
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(lastSearch, 'маникюр');
    expect(find.text('Salon'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('category suggestion tap runs canonical search', (tester) async {
    var lastSearch = '';
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ..._baseOverrides(history: const []),
          businessesProvider.overrideWith((ref, query) async {
            lastSearch = query.search ?? '';
            return PaginatedBusinesses(items: [], total: 0);
          }),
        ],
        child: wrapWithL10n(const SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'рест');
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pumpAndSettle();
    expect(find.text('Рестораны'), findsWidgets);
    await tester.tap(find.text('Рестораны').first);
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pumpAndSettle();
    expect(lastSearch, 'Рестораны');
  });

  testWidgets('stale request cannot overwrite suggestion selection', (tester) async {
    final gateOld = Completer<void>();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ..._baseOverrides(history: const []),
          businessesProvider.overrideWith((ref, query) async {
            final search = query.search ?? '';
            if (search == 'ман') {
              await gateOld.future;
              return PaginatedBusinesses(
                items: [
                  BusinessModel(
                    id: 'old',
                    title: 'Old',
                    slug: 'old',
                    address: 'A',
                    categoryTitle: 'C',
                    categoryId: 'cat1',
                  ),
                ],
                total: 1,
              );
            }
            if (search == 'Рестораны') {
              return PaginatedBusinesses(
                items: [
                  BusinessModel(
                    id: 'new',
                    title: 'New',
                    slug: 'new',
                    address: 'A',
                    categoryTitle: 'C',
                    categoryId: 'cat2',
                  ),
                ],
                total: 1,
              );
            }
            return PaginatedBusinesses(items: [], total: 0);
          }),
        ],
        child: wrapWithL10n(const SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'ман');
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pump();

    await tester.enterText(find.byType(TextField), 'рест');
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Рестораны').first);
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pumpAndSettle();
    expect(find.text('New'), findsOneWidget);

    gateOld.complete();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text('Old'), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('320dp KK textScale 2.0 history header no overflow', (tester) async {
    tester.view.physicalSize = const Size(320, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(2.0)),
        child: ProviderScope(
          overrides: [
            ..._baseOverrides(history: const ['маникюр']),
            appLocaleCodeProvider.overrideWith((ref) => 'kk'),
          ],
          child: wrapWithL10n(
            const SearchScreen(),
            locale: const Locale('kk'),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('Соңғы сұраныстар'), findsOneWidget);
  });
}

List<Override> _baseOverrides({required List<String> history}) {
  return [
    cityProvider.overrideWith(() => _FixedCityNotifier()),
    categoriesProvider.overrideWith((ref) async => _sampleCategories()),
    searchTaxonomySubcategoriesProvider.overrideWith((ref) async => _sampleSubcategories()),
    searchRecentHistoryProvider.overrideWith(() => _FakeHistoryNotifier(history)),
    businessesProvider.overrideWith(
      (ref, query) async => PaginatedBusinesses(items: [], total: 0),
    ),
    nearbySearchPositionProvider.overrideWith(
      (ref) => const UserPosition(latitude: 51.23, longitude: 51.38),
    ),
    citiesProvider.overrideWith(
      (ref) async => [
        {'id': 'city-1', 'slug': 'uralsk', 'nameRu': 'Уральск'},
      ],
    ),
    analyticsVisitorIdProvider.overrideWith((ref) async => 'a' * 32),
  ];
}

class _FakeHistoryNotifier extends SearchRecentHistoryNotifier {
  _FakeHistoryNotifier(this._seed);

  final List<String> _seed;

  @override
  Future<List<String>> build() async => List<String>.from(_seed);

  @override
  Future<void> clear() async {
    state = const AsyncData([]);
  }
}

List<CategoryModel> _sampleCategories() => [
      CategoryModel(
        id: 'cat1',
        title: 'Coffee',
        nameRu: 'Кофейни',
        nameKk: 'Кофейнялар',
        slug: 'coffee',
      ),
      CategoryModel(
        id: 'cat2',
        title: 'Food',
        nameRu: 'Рестораны',
        nameKk: 'Мейрамханалар',
        slug: 'food',
      ),
    ];

List<SubcategoryModel> _sampleSubcategories() => [
      SubcategoryModel(
        id: 'sub1',
        categoryId: 'cat2',
        slug: 'fine-dining',
        nameRu: 'Рестораны',
        nameKk: 'Мейрамханалар',
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
