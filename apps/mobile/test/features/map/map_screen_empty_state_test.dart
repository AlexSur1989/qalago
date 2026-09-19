import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/location/user_location_provider.dart';
import 'package:qalago_mobile/core/providers/city_catalog_provider.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/map/presentation/map_screen.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/models/models.dart';

import '../../support/l10n_test_harness.dart';
import 'map_test_overrides.dart';

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isAuthenticated: false);
}

class _UralskCityNotifier extends CityNotifier {
  @override
  CityState build() => const CityState(
        slug: 'uralsk',
        nameRu: 'Уральск',
        launchStatus: 'LIVE',
        centerLat: 51.2278,
        centerLng: 51.3865,
      );
}

Future<void> _disposeTimers(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump(const Duration(milliseconds: 700));
}

Future<void> _pumpMap(
  WidgetTester tester, {
  required List<Override> overrides,
}) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.binding.setSurfaceSize(const Size(390, 844));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  await tester.pumpWidget(
    wrapWithL10n(
      ProviderScope(
        overrides: [
          authProvider.overrideWith(() => _GuestAuthNotifier()),
          cityProvider.overrideWith(() => _UralskCityNotifier()),
          userLocationProvider.overrideWith((ref) => Stream.value(null)),
          ...overrides,
        ],
        child: const MapScreen(),
      ),
      locale: const Locale('ru'),
    ),
  );
  await tester.pumpAndSettle();
  expect(tester.takeException(), isNull);
}

void main() {
  group('MapScreen empty semantics', () {
    testWidgets('viewport zero with city businesses does not show EmptyCityView',
        (tester) async {
      final l10n = lookupAppLocalizations(const Locale('ru'));
      await _pumpMap(
        tester,
        overrides: [
          cityCatalogTotalProvider.overrideWith((ref) async => 15),
          mapBusinessesForTest(items: const [], viewportTotal: 0),
        ],
      );

      expect(find.text(l10n.emptyCitySoonTitle('Уральск')), findsNothing);
      expect(find.text(l10n.mapNoCoordinates), findsOneWidget);
      await _disposeTimers(tester);
    });

    testWidgets('city catalog zero shows EmptyCityView', (tester) async {
      final l10n = lookupAppLocalizations(const Locale('ru'));
      await _pumpMap(
        tester,
        overrides: [
          cityCatalogTotalProvider.overrideWith((ref) async => 0),
          mapBusinessesForTest(items: const [], viewportTotal: 0),
        ],
      );

      expect(find.text(l10n.emptyCitySoonTitle('Уральск')), findsOneWidget);
      await _disposeTimers(tester);
    });

    testWidgets('viewport with businesses shows sheet not city empty',
        (tester) async {
      final l10n = lookupAppLocalizations(const Locale('ru'));
      await _pumpMap(
        tester,
        overrides: [
          cityCatalogTotalProvider.overrideWith((ref) async => 15),
          mapBusinessesForTest(
            items: [
              BusinessModel(
                id: 'b1',
                title: 'Test Cafe',
                slug: 'test-cafe',
                address: 'Street',
                latitude: 51.23,
                longitude: 51.38,
              ),
            ],
            viewportTotal: 1,
          ),
        ],
      );

      expect(find.text(l10n.emptyCitySoonTitle('Уральск')), findsNothing);
      expect(find.text('Test Cafe'), findsWidgets);
      await _disposeTimers(tester);
    });
  });
}
