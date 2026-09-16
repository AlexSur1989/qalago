import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/search/presentation/search_screen.dart';
import 'package:qalago_mobile/shared/models/models.dart';

import '../support/l10n_test_harness.dart';

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

void main() {
  const widths = [320.0, 360.0, 390.0, 430.0];
  const scales = [1.0, 1.3, 2.0];

  for (final width in widths) {
    for (final scale in scales) {
      for (final locale in [const Locale('ru'), const Locale('kk')]) {
        testWidgets(
          'search layout ${width.toInt()} ${locale.languageCode} scale $scale',
          (tester) async {
            tester.view.physicalSize = Size(width, 1200);
            tester.view.devicePixelRatio = 1.0;
            addTearDown(tester.view.resetPhysicalSize);

            await tester.pumpWidget(
              MediaQuery(
                data: MediaQueryData(
                  textScaler: TextScaler.linear(scale),
                ),
                child: ProviderScope(
                  overrides: [
                    cityProvider.overrideWith(() => _FixedCityNotifier()),
                    categoriesProvider.overrideWith((ref) async => _sampleCategories()),
                    businessesProvider.overrideWith((ref, query) async {
                      return PaginatedBusinesses(
                        items: [
                          BusinessModel(
                            id: 'b1',
                            title: 'Test Biz ${'x' * 20}',
                            slug: 'test',
                            address: 'Address',
                            categoryTitle: 'Cat',
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
                  child: wrapWithL10n(
                    const SearchScreen(
                      initialQuery: 'query',
                      categoryId: 'cat1',
                      initialRadiusKm: '5',
                    ),
                    locale: locale,
                  ),
                ),
              ),
            );

            await tester.pumpAndSettle();
            expect(tester.takeException(), isNull);
            await tester.pumpWidget(const SizedBox.shrink());
            await tester.pump(const Duration(milliseconds: 700));
          },
        );
      }
    }
  }
}
