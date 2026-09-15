import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/providers/city_catalog_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/ads/data/ad_models.dart';
import 'package:qalago_mobile/features/ads/data/ad_placement_codes.dart';
import 'package:qalago_mobile/features/ads/providers/ad_serve_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/categories/data/category_directory_layout.dart';
import 'package:qalago_mobile/features/categories/presentation/categories_screen.dart';
import 'package:qalago_mobile/features/categories/presentation/category_businesses_screen.dart';
import 'package:qalago_mobile/features/categories/presentation/category_subcategory_filter.dart';
import 'package:qalago_mobile/features/categories/utils/category_list_utils.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/models/models.dart';

import '../support/l10n_test_harness.dart';

Future<void> _disposeTrackedImpressionTimers(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump(const Duration(milliseconds: 700));
}

CategoryModel _cat(int i) => CategoryModel(
      id: 'c$i',
      title: 'Category $i',
      nameRu: 'Category $i',
      nameKk: 'Sanat $i',
      slug: 'c$i',
    );

SubcategoryModel _sub(int i) => SubcategoryModel(
      id: 's$i',
      categoryId: 'c1',
      slug: 'sub$i',
      nameRu: 'Sub $i',
      nameKk: 'Sub KK $i',
    );

void main() {
  test('category directory uses 3 columns on phone width', () {
    expect(categoryDirectoryGridColumns(320), 3);
    expect(categoryDirectoryGridColumns(720), 4);
    expect(categoryDirectoryGridColumns(900), 5);
  });

  testWidgets('Categories root shows directory grid', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _CityNotifier()),
          cityCatalogTotalProvider.overrideWith((ref) async => 10),
          categoriesProvider.overrideWith((ref) async => List.generate(5, _cat)),
          unreadNotificationsProvider.overrideWith((ref) async => 0),
        ],
        child: wrapWithL10n(const CategoriesScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('categories_directory_grid')), findsOneWidget);
    expect(find.text('Category 0'), findsOneWidget);
  });

  testWidgets('Category businesses uses categoryRecommended heading', (tester) async {
    final biz = BusinessModel(
      id: 'b1',
      title: 'Organic Cafe',
      slug: 'organic',
      address: 'Addr',
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _CityNotifier()),
          categoriesProvider.overrideWith((ref) async => [_cat(1)]),
          categorySubcategoriesProvider('c1').overrideWith((ref) async => []),
          categoryBusinessesProvider.overrideWith(
            (ref, query) async => PaginatedBusinesses(
              items: [biz],
              total: 1,
            ),
          ),
          categoryRecommendedProvider.overrideWith(
            (ref, query) async => [biz],
          ),
          serveAdsProvider.overrideWith(
            (ref, scope) async => const <AdItemModel>[],
          ),
        ],
        child: wrapWithL10n(
          const CategoryBusinessesScreen(
            categoryId: 'c1',
            categoryTitle: 'Category 1',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    final l10n = lookupAppLocalizations(const Locale('ru'));
    expect(find.text(l10n.categoryRecommended), findsWidgets);
    expect(find.text(l10n.homeRecommendedSection), findsNothing);
    await _disposeTrackedImpressionTimers(tester);
  });

  testWidgets('Category businesses hides raw Dio errors', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _CityNotifier()),
          categoriesProvider.overrideWith((ref) async => [_cat(1)]),
          categoryBusinessesProvider.overrideWith(
            (ref, query) async {
              throw DioException(
                requestOptions: RequestOptions(path: '/businesses'),
                type: DioExceptionType.connectionError,
              );
            },
          ),
          serveAdsProvider.overrideWith(
            (ref, scope) async => const <AdItemModel>[],
          ),
        ],
        child: wrapWithL10n(
          const CategoryBusinessesScreen(
            categoryId: 'c1',
            categoryTitle: 'Category 1',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('DioException'), findsNothing);
    expect(find.text(l10nRetryLabel(const Locale('ru'))), findsOneWidget);
    await _disposeTrackedImpressionTimers(tester);
  });

  testWidgets('Subcategory grid shows all businesses control', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _CityNotifier()),
          categoriesProvider.overrideWith((ref) async => [_cat(1)]),
          categorySubcategoriesProvider('c1').overrideWith(
            (ref) async => [_sub(1)],
          ),
          categoryBusinessesProvider.overrideWith(
            (ref, query) async => PaginatedBusinesses(items: const [], total: 0),
          ),
          categoryRecommendedProvider.overrideWith((ref, query) async => const []),
          serveAdsProvider.overrideWith(
            (ref, scope) async => const <AdItemModel>[],
          ),
        ],
        child: wrapWithL10n(
          const CategoryBusinessesScreen(
            categoryId: 'c1',
            categoryTitle: 'Category 1',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    final l10n = lookupAppLocalizations(const Locale('ru'));
    expect(find.text(l10n.categoryAllBusinesses), findsOneWidget);
    expect(find.byKey(const Key('subcategory_icon_grid')), findsOneWidget);
    await _disposeTrackedImpressionTimers(tester);
  });

  test('paid duplication in all places remains current contract', () {
    const paidId = 'paid-biz';
    final ads = [
      AdItemModel(
        campaignId: 'c1',
        placementId: 'p1',
        placementCode: AdPlacementCodes.categoryTop,
        position: 1,
        sponsored: true,
        displayLabel: 'Реклама',
        business: {'id': paidId, 'title': 'Paid'},
      ),
    ];
    final allItems = [
      BusinessModel(id: 'o1', title: 'Organic', slug: 'o', address: 'B'),
      BusinessModel(id: paidId, title: 'Paid', slug: 'p', address: 'A'),
    ];
    final paidIds = collectPaidBusinessIds(ads);
    final recommended = buildCategoryRecommendedOrganic(
      recommendedSorted: allItems,
      paidBusinessIds: paidIds,
    );
    final allPlaces = categoryAllPlacesAfterSponsored(
      allPlaces: allItems,
      sponsoredBusinessIdsInOrder: [paidId],
    );
    expect(recommended.map((b) => b.id), ['o1']);
    expect(allPlaces.map((b) => b.id), contains(paidId));
  });

  testWidgets('Router fallback title is localized KK', (tester) async {
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => CategoryBusinessesScreen(
            categoryId: 'c1',
            categoryTitle: context.l10n.categoryFallbackTitle,
          ),
        ),
      ],
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cityProvider.overrideWith(() => _CityNotifier()),
          categoriesProvider.overrideWith((ref) async => [_cat(1)]),
          categorySubcategoriesProvider('c1').overrideWith((ref) async => []),
          categoryBusinessesProvider.overrideWith(
            (ref, query) async => PaginatedBusinesses(items: const [], total: 0),
          ),
          categoryRecommendedProvider.overrideWith((ref, query) async => const []),
          serveAdsProvider.overrideWith(
            (ref, scope) async => const <AdItemModel>[],
          ),
        ],
        child: wrapRouterWithL10n(router, locale: const Locale('kk')),
      ),
    );
    await tester.pumpAndSettle();
    final l10n = lookupAppLocalizations(const Locale('kk'));
    expect(find.text('Category 1'), findsOneWidget);
    expect(find.text(l10n.categoryFallbackTitle), findsNothing);
    await _disposeTrackedImpressionTimers(tester);
  });
}

String l10nRetryLabel(Locale locale) {
  return lookupAppLocalizations(locale).commonRetry;
}

class _CityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(slug: 'uralsk', nameRu: 'Уральск');
}
