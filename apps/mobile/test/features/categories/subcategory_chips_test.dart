import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/release/app_config_provider.dart';
import 'package:qalago_mobile/features/categories/presentation/category_subcategory_filter.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  const categoryId = 'cat-food';

  testWidgets('subcategory chips hidden when feature flag off', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          subcategoriesEnabledProvider.overrideWithValue(false),
          categorySubcategoriesProvider(categoryId).overrideWith(
            (ref) async => [
              SubcategoryModel(
                id: 'sub1',
                categoryId: categoryId,
                slug: 'coffee',
                nameRu: 'Кофе',
                nameKk: 'Кофе',
              ),
            ],
          ),
        ],
        child: const MaterialApp(
          home: Scaffold(
            body: CategorySubcategoryFilterBar(categoryId: categoryId),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Все'), findsNothing);
    expect(find.text('Кофе'), findsNothing);
  });

  testWidgets('subcategory chips visible when flag on and subs exist', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          subcategoriesEnabledProvider.overrideWithValue(true),
          categorySubcategoriesProvider(categoryId).overrideWith(
            (ref) async => [
              SubcategoryModel(
                id: 'sub1',
                categoryId: categoryId,
                slug: 'coffee',
                nameRu: 'Кофе',
                nameKk: 'Кофе',
              ),
              SubcategoryModel(
                id: 'sub2',
                categoryId: categoryId,
                slug: 'bakery',
                nameRu: 'Пекарни',
                nameKk: 'Нанханалар',
              ),
            ],
          ),
        ],
        child: const MaterialApp(
          home: Scaffold(
            body: CategorySubcategoryFilterBar(categoryId: categoryId),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Все'), findsOneWidget);
    expect(find.text('Кофе'), findsOneWidget);
    expect(find.text('Пекарни'), findsOneWidget);

    await tester.tap(find.text('Кофе'));
    await tester.pumpAndSettle();

    final container = ProviderScope.containerOf(
      tester.element(find.byType(CategorySubcategoryFilterBar)),
    );
    expect(container.read(categorySubcategoryFilterProvider(categoryId)), 'sub1');
  });
}
