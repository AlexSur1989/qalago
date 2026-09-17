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
import 'package:qalago_mobile/shared/models/models.dart';
import '../support/l10n_test_harness.dart';

void main() {
  testWidgets('initial empty search state RU', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _baseOverrides(),
        child: wrapWithL10n(const SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Найдите место или услугу'), findsOneWidget);
  });

  testWidgets('one-character continue typing state', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _baseOverrides(),
        child: wrapWithL10n(const SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'м');
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pumpAndSettle();
    expect(find.text('Продолжайте ввод — нужно минимум 2 символа'), findsOneWidget);
    expect(find.text('Найдено:'), findsNothing);
  });

  testWidgets('stale response cannot replace newer query', (tester) async {
    final gateA = Completer<void>();
    final gateB = Completer<void>();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ..._baseOverrides(),
          businessesProvider.overrideWith((ref, query) async {
            final search = query.search ?? '';
            if (search == 'ман') {
              await gateA.future;
              return PaginatedBusinesses(
                items: [
                  BusinessModel(
                    id: 'a',
                    title: 'Business A',
                    slug: 'a',
                    address: 'A',
                    categoryTitle: 'C',
                    categoryId: 'cat1',
                  ),
                ],
                total: 1,
              );
            }
            if (search == 'маникюр') {
              await gateB.future;
              return PaginatedBusinesses(
                items: [
                  BusinessModel(
                    id: 'b',
                    title: 'Business B',
                    slug: 'b',
                    address: 'B',
                    categoryTitle: 'C',
                    categoryId: 'cat1',
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

    await tester.enterText(find.byType(TextField), 'маникюр');
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pump();

    gateB.complete();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text('Business B'), findsOneWidget);
    expect(find.text('Business A'), findsNothing);

    gateA.complete();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text('Business B'), findsOneWidget);
    expect(find.text('Business A'), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('clear while request in flight stays initial', (tester) async {
    final gate = Completer<void>();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ..._baseOverrides(),
          businessesProvider.overrideWith((ref, query) async {
            if (query.search == 'караоке') {
              await gate.future;
              return PaginatedBusinesses(
                items: [
                  BusinessModel(
                    id: 'k',
                    title: 'Karaoke Place',
                    slug: 'k',
                    address: 'A',
                    categoryTitle: 'C',
                    categoryId: 'cat1',
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

    await tester.enterText(find.byType(TextField), 'караоке');
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pump();

    await tester.tap(find.bySemanticsLabel('Очистить'));
    await tester.pump();
    expect(find.text('Найдите место или услугу'), findsOneWidget);

    gate.complete();
    await tester.pumpAndSettle();
    expect(find.text('Karaoke Place'), findsNothing);
    expect(find.text('Найдите место или услугу'), findsOneWidget);
  });

  testWidgets('filter change while request in flight keeps latest category',
      (tester) async {
    final gateCat1 = Completer<void>();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ..._baseOverrides(),
          businessesProvider.overrideWith((ref, query) async {
            if (query.categoryId == 'cat1') {
              await gateCat1.future;
              return PaginatedBusinesses(
                items: [
                  BusinessModel(
                    id: 'cat1biz',
                    title: 'Cat1 Biz',
                    slug: 'c1',
                    address: 'A',
                    categoryTitle: 'C',
                    categoryId: 'cat1',
                  ),
                ],
                total: 1,
              );
            }
            if (query.categoryId == 'cat2') {
              return PaginatedBusinesses(
                items: [
                  BusinessModel(
                    id: 'cat2biz',
                    title: 'Cat2 Biz',
                    slug: 'c2',
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
        child: wrapWithL10n(
          const SearchScreen(initialQuery: 'ресторан', categoryId: 'cat1'),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    await tester.tap(find.text('Рестораны'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Cat2 Biz'), findsOneWidget);
    expect(find.text('Cat1 Biz'), findsNothing);

    gateCat1.complete();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));
    expect(find.text('Cat2 Biz'), findsOneWidget);
    expect(find.text('Cat1 Biz'), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('network error shows retry without clearing query', (tester) async {
    var calls = 0;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ..._baseOverrides(),
          businessesProvider.overrideWith((ref, query) async {
            calls++;
            if (calls == 1) {
              throw Exception('network');
            }
            return PaginatedBusinesses(
              items: [
                BusinessModel(
                  id: 'ok',
                  title: 'Recovered',
                  slug: 'ok',
                  address: 'A',
                  categoryTitle: 'C',
                  categoryId: 'cat1',
                ),
              ],
              total: 1,
            );
          }),
        ],
        child: wrapWithL10n(const SearchScreen(initialQuery: 'tea')),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Не удалось загрузить результаты'), findsOneWidget);

    await tester.tap(find.text('Повторить'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text('Recovered'), findsOneWidget);
    final field = tester.widget<TextField>(find.byType(TextField));
    expect(field.controller?.text, 'tea');

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(milliseconds: 700));
  });

  testWidgets('keyboard search submits immediately', (tester) async {
    BusinessesQuery? captured;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ..._baseOverrides(),
          businessesProvider.overrideWith((ref, query) async {
            captured = query;
            return PaginatedBusinesses(items: [], total: 0);
          }),
        ],
        child: wrapWithL10n(const SearchScreen()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'кофе');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();
    expect(captured?.search, 'кофе');
  });

  testWidgets('KK initial title', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ..._baseOverrides(),
          appLocaleCodeProvider.overrideWith((ref) => 'kk'),
        ],
        child: wrapWithL10n(
          const SearchScreen(),
          locale: const Locale('kk'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Орын немесе қызмет табыңыз'), findsOneWidget);
  });

  testWidgets('320dp KK text scale 2.0 no overflow', (tester) async {
    tester.view.physicalSize = const Size(320, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(2.0)),
        child: ProviderScope(
          overrides: [
            ..._baseOverrides(),
            appLocaleCodeProvider.overrideWith((ref) => 'kk'),
          ],
          child: wrapWithL10n(
            const SearchScreen(initialQuery: 'x', categoryId: 'cat1'),
            locale: const Locale('kk'),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

List<Override> _baseOverrides() {
  return [
    cityProvider.overrideWith(() => _FixedCityNotifier()),
    categoriesProvider.overrideWith((ref) async => _sampleCategories()),
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
