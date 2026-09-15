import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/theme/app_theme.dart';
import 'package:qalago_mobile/core/theme/qalago_touch_targets.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/widgets/qalago_bottom_navigation.dart';

import '../support/l10n_test_harness.dart';

Widget _nav({
  required Locale locale,
  required double width,
  required TextScaler textScaler,
  required int selected,
}) {
  return MaterialApp(
    theme: AppTheme.light,
    locale: locale,
    localizationsDelegates: l10nDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: MediaQuery(
      data: MediaQueryData(
        size: Size(width, 600),
        textScaler: textScaler,
        padding: const EdgeInsets.only(bottom: 34),
      ),
      child: Scaffold(
        bottomNavigationBar: Builder(
          builder: (context) {
            final l10n = AppLocalizations.of(context)!;
            return QalaGoBottomNavigation(
              currentIndex: selected,
              items: [
                QalaGoBottomNavItem(
                  label: l10n.navHome,
                  icon: Icons.home_outlined,
                  selectedIcon: Icons.home,
                  onTap: () {},
                ),
                QalaGoBottomNavItem(
                  label: l10n.navCategories,
                  icon: Icons.grid_view_outlined,
                  selectedIcon: Icons.grid_view,
                  onTap: () {},
                ),
                QalaGoBottomNavItem(
                  label: l10n.navMap,
                  icon: Icons.location_on_outlined,
                  selectedIcon: Icons.location_on,
                  onTap: () {},
                ),
                QalaGoBottomNavItem(
                  label: l10n.navFavorites,
                  icon: Icons.favorite_border,
                  selectedIcon: Icons.favorite,
                  onTap: () {},
                ),
                QalaGoBottomNavItem(
                  label: l10n.navProfile,
                  icon: Icons.person_outline,
                  selectedIcon: Icons.person,
                  onTap: () {},
                ),
              ],
            );
          },
        ),
      ),
    ),
  );
}

void main() {
  group('QalaGoBottomNavigation semantics', () {
    testWidgets('RU tab labels exposed once', (tester) async {
      await tester.pumpWidget(_nav(
        locale: const Locale('ru'),
        width: 390,
        textScaler: TextScaler.noScaling,
        selected: 0,
      ));
      await tester.pumpAndSettle();

      expect(find.bySemanticsLabel('Главная'), findsOneWidget);
      expect(find.bySemanticsLabel('Избранное'), findsOneWidget);
    });

    testWidgets('KK tab labels', (tester) async {
      await tester.pumpWidget(_nav(
        locale: const Locale('kk'),
        width: 390,
        textScaler: TextScaler.noScaling,
        selected: 3,
      ));
      await tester.pumpAndSettle();

      expect(find.bySemanticsLabel('Таңдаулылар'), findsOneWidget);
    });

    testWidgets('selected tab updates on tap', (tester) async {
      var index = 0;
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light,
          locale: const Locale('ru'),
          localizationsDelegates: l10nDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: StatefulBuilder(
            builder: (context, setState) {
              final l10n = AppLocalizations.of(context)!;
              return Scaffold(
                bottomNavigationBar: QalaGoBottomNavigation(
                  currentIndex: index,
                  items: [
                    QalaGoBottomNavItem(
                      label: l10n.navHome,
                      icon: Icons.home_outlined,
                      selectedIcon: Icons.home,
                      onTap: () => setState(() => index = 0),
                    ),
                    QalaGoBottomNavItem(
                      label: l10n.navCategories,
                      icon: Icons.grid_view_outlined,
                      selectedIcon: Icons.grid_view,
                      onTap: () => setState(() => index = 1),
                    ),
                    QalaGoBottomNavItem(
                      label: l10n.navMap,
                      icon: Icons.location_on_outlined,
                      selectedIcon: Icons.location_on,
                      onTap: () => setState(() => index = 2),
                    ),
                    QalaGoBottomNavItem(
                      label: l10n.navFavorites,
                      icon: Icons.favorite_border,
                      selectedIcon: Icons.favorite,
                      onTap: () => setState(() => index = 3),
                    ),
                    QalaGoBottomNavItem(
                      label: l10n.navProfile,
                      icon: Icons.person_outline,
                      selectedIcon: Icons.person,
                      onTap: () => setState(() => index = 4),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      );

      await tester.tap(find.bySemanticsLabel('Категории'));
      await tester.pumpAndSettle();
      expect(index, 1);
    });
  });

  group('QalaGoBottomNavigation layout', () {
    Future<void> pumpMatrix(
      WidgetTester tester, {
      required Locale locale,
      required double width,
      required TextScaler textScaler,
    }) async {
      await tester.binding.setSurfaceSize(Size(width, 640));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(_nav(
        locale: locale,
        width: width,
        textScaler: textScaler,
        selected: 2,
      ));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    }

    testWidgets('320 RU 1.0', (tester) async {
      await pumpMatrix(tester, locale: const Locale('ru'), width: 320, textScaler: TextScaler.noScaling);
    });
    testWidgets('320 KK 1.0', (tester) async {
      await pumpMatrix(tester, locale: const Locale('kk'), width: 320, textScaler: TextScaler.noScaling);
    });
    testWidgets('320 RU 1.3', (tester) async {
      await pumpMatrix(tester, locale: const Locale('ru'), width: 320, textScaler: const TextScaler.linear(1.3));
    });
    testWidgets('320 KK 1.3', (tester) async {
      await pumpMatrix(tester, locale: const Locale('kk'), width: 320, textScaler: const TextScaler.linear(1.3));
    });
    testWidgets('320 RU 2.0', (tester) async {
      await pumpMatrix(tester, locale: const Locale('ru'), width: 320, textScaler: const TextScaler.linear(2.0));
    });
    testWidgets('320 KK 2.0', (tester) async {
      await pumpMatrix(tester, locale: const Locale('kk'), width: 320, textScaler: const TextScaler.linear(2.0));
    });
    testWidgets('360 smoke', (tester) async {
      await pumpMatrix(tester, locale: const Locale('ru'), width: 360, textScaler: TextScaler.noScaling);
    });
    testWidgets('390 smoke', (tester) async {
      await pumpMatrix(tester, locale: const Locale('ru'), width: 390, textScaler: TextScaler.noScaling);
    });
    testWidgets('430 smoke', (tester) async {
      await pumpMatrix(tester, locale: const Locale('ru'), width: 430, textScaler: TextScaler.noScaling);
    });

    testWidgets('tab hit target at least 48', (tester) async {
      await tester.pumpWidget(_nav(
        locale: const Locale('ru'),
        width: 390,
        textScaler: TextScaler.noScaling,
        selected: 0,
      ));
      await tester.pumpAndSettle();
      final tab = find.bySemanticsLabel('Карта');
      expect(tab, findsOneWidget);
      final size = tester.getSize(tab);
      expect(size.height, greaterThanOrEqualTo(QalaGoTouchTargets.minInteractive));
    });
  });
}
