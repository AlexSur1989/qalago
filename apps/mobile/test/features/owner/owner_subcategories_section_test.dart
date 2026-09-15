import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart';
import 'package:qalago_mobile/core/rbac/business_access.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/categories/presentation/category_subcategory_filter.dart';
import 'package:qalago_mobile/features/owner/presentation/widgets/owner_subcategories_section.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/models/models.dart';

final _subs = [
  SubcategoryModel(
    id: 'sub-1',
    categoryId: 'cat-1',
    slug: 'cafe',
    nameRu: 'Кафе RU',
    nameKk: 'Кафе KK',
  ),
  SubcategoryModel(
    id: 'sub-2',
    categoryId: 'cat-1',
    slug: 'bar',
    nameRu: 'Бар RU',
    nameKk: 'Бар KK',
  ),
];

MyBusinessEntry _entryWithProfileEdit(String businessId, {bool grant = true}) {
  return MyBusinessEntry(
    business: {'id': businessId, 'title': 'Biz'},
    access: BusinessAccess(
      role: BusinessAccessRole.manager,
      permissions: grant
          ? const [BusinessPermission.businessProfileEdit]
          : const [BusinessPermission.catalogEdit],
    ),
  );
}

Widget _wrap({
  required Widget child,
  required Locale locale,
  required List<MyBusinessEntry> entries,
  required String categoryId,
  Future<List<SubcategoryModel>> Function()? subs,
}) {
  return ProviderScope(
    overrides: [
      appLocaleCodeProvider.overrideWith((ref) => locale.languageCode),
      myBusinessEntriesProvider.overrideWith((ref) async => entries),
      categorySubcategoriesProvider(categoryId).overrideWith(
        (ref) async => subs != null ? await subs() : _subs,
      ),
    ],
    child: MaterialApp(
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(body: SingleChildScrollView(child: child)),
    ),
  );
}

void main() {
  testWidgets('RU section title and chip labels', (tester) async {
    await tester.pumpWidget(
      _wrap(
        locale: const Locale('ru'),
        categoryId: 'cat-1',
        entries: [_entryWithProfileEdit('b1')],
        child: const OwnerSubcategoriesSection(
          businessId: 'b1',
          businessData: {
            'categoryId': 'cat-1',
            'subcategories': [
              {'id': 'sub-1'},
            ],
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Подкатегории'), findsOneWidget);
    expect(find.text('Кафе RU'), findsOneWidget);
    expect(find.text('Сохранить подкатегории'), findsOneWidget);
  });

  testWidgets('KK section title and kk label', (tester) async {
    await tester.pumpWidget(
      _wrap(
        locale: const Locale('kk'),
        categoryId: 'cat-1',
        entries: [_entryWithProfileEdit('b1')],
        child: const OwnerSubcategoriesSection(
          businessId: 'b1',
          businessData: {
            'categoryId': 'cat-1',
            'subcategories': [],
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Ішкі санаттар'), findsOneWidget);
    expect(find.text('Кафе KK'), findsOneWidget);
  });

  testWidgets('zero subcategories shows empty state', (tester) async {
    await tester.pumpWidget(
      _wrap(
        locale: const Locale('ru'),
        categoryId: 'cat-empty',
        entries: [_entryWithProfileEdit('b2')],
        subs: () async => <SubcategoryModel>[],
        child: const OwnerSubcategoriesSection(
          businessId: 'b2',
          businessData: {
            'categoryId': 'cat-empty',
            'subcategories': [],
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text('Подкатегории пока не настроены для вашей категории.'),
      findsOneWidget,
    );
    expect(find.text('Сохранить подкатегории'), findsNothing);
  });

  testWidgets('hides save when BUSINESS_PROFILE_EDIT missing', (tester) async {
    await tester.pumpWidget(
      _wrap(
        locale: const Locale('ru'),
        categoryId: 'cat-1',
        entries: [_entryWithProfileEdit('b1', grant: false)],
        child: const OwnerSubcategoriesSection(
          businessId: 'b1',
          businessData: {
            'categoryId': 'cat-1',
            'subcategories': [],
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Сохранить подкатегории'), findsNothing);
  });
}
