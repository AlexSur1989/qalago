import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/onboarding/onboarding_prefs.dart';
import 'package:qalago_mobile/core/locale/app_locale_provider.dart' show appLocaleCodeProvider;
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/onboarding/presentation/onboarding_city_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:qalago_mobile/l10n/app_localizations.dart';

import '../support/l10n_test_harness.dart';
import '../support/onboarding_test_support.dart';

void main() {
  testWidgets('city onboarding uses offline list when catalog fetch fails',
      (tester) async {
    await seedFirstLaunchOnboarding();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appLocaleCodeProvider.overrideWith((ref) => 'kk'),
          citiesProvider.overrideWith(
            (ref) async => resolveCityCatalogList(
              () async => throw Exception('catalog unavailable'),
            ),
          ),
        ],
        child: MaterialApp.router(
          locale: const Locale('kk'),
          localizationsDelegates: l10nDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          routerConfig: GoRouter(
            initialLocation: '/onboarding/city',
            routes: [
              GoRoute(
                path: '/onboarding/city',
                builder: (context, state) => const OnboardingCityScreen(),
              ),
              GoRoute(
                path: '/home',
                builder: (context, state) =>
                    const Scaffold(body: Text('home-dest')),
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Не удалось загрузить список городов'), findsNothing);
    expect(find.text('Орал'), findsOneWidget);
    expect(find.text('Жалғастыру'), findsOneWidget);

    await tester.tap(find.text('Жалғастыру'));
    await tester.pumpAndSettle();

    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool(OnboardingPrefs.completedKey), isTrue);
    expect(prefs.getString('selected_city_slug'), 'uralsk');
    expect(find.text('home-dest'), findsOneWidget);
  });

  testWidgets('city onboarding blocks only when provider truly errors',
      (tester) async {
    await seedFirstLaunchOnboarding();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          citiesProvider.overrideWith((ref) async => throw StateError('fatal')),
        ],
        child: wrapWithL10n(const OnboardingCityScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Не удалось загрузить список городов'), findsOneWidget);
    expect(find.text('Повторить'), findsOneWidget);
  });
}
