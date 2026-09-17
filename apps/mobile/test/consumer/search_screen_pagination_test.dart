import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/catalog/data/catalog_repository.dart';
import 'package:qalago_mobile/features/search/presentation/search_screen.dart';
import 'package:qalago_mobile/features/search/search_catalog_sort.dart';
import 'package:qalago_mobile/features/search/search_pagination.dart';
import 'package:qalago_mobile/shared/models/models.dart';

import '../support/l10n_test_harness.dart';

BusinessModel _biz(String id, String title) => BusinessModel(
      id: id,
      title: title,
      slug: id,
      address: 'A',
      categoryTitle: 'C',
      categoryId: 'cat1',
    );

void main() {
  test('mergeSearchResultPages deduplicates by id', () {
    final merged = mergeSearchResultPages(
      [_biz('a', 'A')],
      [_biz('a', 'A dup'), _biz('b', 'B')],
    );
    expect(merged.map((e) => e.id).toList(), ['a', 'b']);
  });

  testWidgets('page 2 append and shown/total count', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _paginationOverrides(
          onFetch: ({required int page, String? search, String? sort}) async {
            if (page == 1) {
              return PaginatedBusinesses(
                items: [_biz('p1-0', 'One 0')],
                total: 3,
              );
            }
            return PaginatedBusinesses(
              items: [
                _biz('p2-0', 'Two 0'),
                _biz('p2-1', 'Two 1'),
              ],
              total: 3,
            );
          },
        ),
        child: wrapWithL10n(const SearchScreen(initialQuery: 'food')),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Показано 1 из 3'), findsOneWidget);
    expect(find.byKey(const Key('search_load_more')), findsOneWidget);

    await tester.tap(find.byKey(const Key('search_load_more')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));
    expect(find.text('Найдено: 3'), findsOneWidget);
    expect(find.text('Two 0'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('query change while page 2 in flight does not append stale page',
      (tester) async {
    final gateA2 = Completer<void>();
    await tester.pumpWidget(
      ProviderScope(
        overrides: _paginationOverrides(
          onFetch: ({required int page, String? search, String? sort}) async {
            if (search == 'alpha' && page == 1) {
              return PaginatedBusinesses(
                items: [_biz('a1', 'Alpha 1')],
                total: 2,
              );
            }
            if (search == 'alpha' && page == 2) {
              await gateA2.future;
              return PaginatedBusinesses(
                items: [_biz('a2', 'Alpha stale')],
                total: 2,
              );
            }
            if (search == 'beta' && page == 1) {
              return PaginatedBusinesses(
                items: [_biz('b1', 'Beta 1')],
                total: 1,
              );
            }
            return PaginatedBusinesses(items: [], total: 0);
          },
        ),
        child: wrapWithL10n(const SearchScreen(initialQuery: 'alpha')),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('search_load_more')));
    await tester.pump();

    await tester.enterText(find.byType(TextField), 'beta');
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Beta 1'), findsOneWidget);
    expect(find.text('Alpha stale'), findsNothing);

    gateA2.complete();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text('Alpha stale'), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('sort change while page 2 in flight', (tester) async {
    final gate = Completer<void>();
    late SearchCatalogSort currentSort;

    Future<PaginatedBusinesses> onFetch({
      required int page,
      String? search,
      String? sort,
    }) async {
      if (page == 2 && currentSort == SearchCatalogSort.recommended) {
        await gate.future;
        return PaginatedBusinesses(
          items: [_biz('r2', 'Rec stale')],
          total: 2,
        );
      }
      if (page == 1 && currentSort == SearchCatalogSort.rating) {
        return PaginatedBusinesses(
          items: [_biz('rat1', 'Rating 1')],
          total: 1,
        );
      }
      return PaginatedBusinesses(
        items: [_biz('r1', 'Rec 1')],
        total: 2,
      );
    }

    currentSort = SearchCatalogSort.recommended;
    await tester.pumpWidget(
      ProviderScope(
        overrides: _paginationOverrides(onFetch: onFetch),
        child: wrapWithL10n(
          KeyedSubtree(
            key: ValueKey<String>(currentSort.apiValue),
            child: SearchScreen(initialQuery: 'tea', initialSort: currentSort.apiValue),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('search_load_more')));
    await tester.pump();

    currentSort = SearchCatalogSort.rating;
    await tester.pumpWidget(
      ProviderScope(
        overrides: _paginationOverrides(onFetch: onFetch),
        child: wrapWithL10n(
          KeyedSubtree(
            key: ValueKey<String>(currentSort.apiValue),
            child: SearchScreen(initialQuery: 'tea', initialSort: currentSort.apiValue),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.text('Rating 1'), findsOneWidget);

    gate.complete();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));
    expect(find.text('Rec stale'), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('next-page error preserves page 1', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _paginationOverrides(
          onFetch: ({required int page, String? search, String? sort}) async {
            if (page == 1) {
              return PaginatedBusinesses(
                items: [_biz('keep', 'Keep me')],
                total: 3,
              );
            }
            throw Exception('page2 fail');
          },
        ),
        child: wrapWithL10n(const SearchScreen(initialQuery: 'xx')),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('search_load_more')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Keep me'), findsOneWidget);
    expect(find.text('Не удалось загрузить ещё'), findsOneWidget);
    expect(find.text('Повторить загрузку'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('RU sort labels visible', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _paginationOverrides(
          onFetch: ({required int page, String? search, String? sort}) async =>
              PaginatedBusinesses(items: [], total: 0),
        ),
        child: wrapWithL10n(const SearchScreen(initialQuery: 'q')),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Рекомендуем'), findsOneWidget);
    await tester.tap(find.text('Рекомендуем'));
    await tester.pumpAndSettle();
    expect(find.text('По рейтингу'), findsOneWidget);
    expect(find.text('Популярные'), findsOneWidget);
  });

  testWidgets('320dp KK textScale 2.0 filter/sort row', (tester) async {
    tester.view.physicalSize = const Size(320, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(2.0)),
        child: ProviderScope(
          overrides: [
            ..._paginationOverrides(
              onFetch: ({required int page, String? search, String? sort}) async =>
                  PaginatedBusinesses(items: [], total: 0),
            ),
            appLocaleCodeProvider.overrideWith((ref) => 'kk'),
          ],
          child: wrapWithL10n(
            const SearchScreen(initialQuery: 'q'),
            locale: const Locale('kk'),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Ұсынылады'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

List<Override> _paginationOverrides({
  required Future<PaginatedBusinesses> Function({
    required int page,
    String? search,
    String? sort,
  }) onFetch,
}) {
  return [
    cityProvider.overrideWith(() => _FixedCityNotifier()),
    categoriesProvider.overrideWith((ref) async => _sampleCategories()),
    businessesProvider.overrideWith((ref, query) async {
      return onFetch(page: 1, search: query.search, sort: query.sort);
    }),
    catalogRepositoryProvider.overrideWith(
      (ref) => _PagingCatalogRepository(onFetch),
    ),
    nearbySearchPositionProvider.overrideWith(
      (ref) => const UserPosition(latitude: 51.23, longitude: 51.38),
    ),
  ];
}

class _PagingCatalogRepository extends CatalogRepository {
  _PagingCatalogRepository(this._onFetch) : super(Dio());

  final Future<PaginatedBusinesses> Function({
    required int page,
    String? search,
    String? sort,
  }) _onFetch;

  @override
  Future<PaginatedBusinesses> fetchBusinesses({
    required String citySlug,
    String? search,
    String? categoryId,
    String? subcategoryId,
    bool? featured,
    bool? forMap,
    double? minLat,
    double? maxLat,
    double? minLng,
    double? maxLng,
    double? latitude,
    double? longitude,
    double? radiusKm,
    int? limit,
    int? page,
    String? sort,
    CancelToken? cancelToken,
  }) {
    return _onFetch(
      page: page ?? 1,
      search: search,
      sort: sort,
    );
  }
}

List<CategoryModel> _sampleCategories() => [
      CategoryModel(
        id: 'cat1',
        title: 'Кофейни',
        nameRu: 'Кофейни',
        nameKk: 'Кофейнялар',
        slug: 'coffee',
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
