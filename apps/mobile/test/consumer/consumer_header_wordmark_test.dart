import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/theme/qalago_touch_targets.dart';
import 'package:qalago_mobile/features/home/presentation/sections/home_header_section.dart';
import 'package:qalago_mobile/shared/widgets/qalago_logo.dart';

import '../support/l10n_test_harness.dart';

void main() {
  group('QalaGoConsumerHeaderLogo.resolveHeight', () {
    test('normal at 390 width textScale 1.0', () {
      expect(
        QalaGoConsumerHeaderLogo.resolveHeight(
          width: 390,
          textScaleFactor: 1,
        ),
        QalaGoConsumerHeaderLogo.normalHeight,
      );
    });

    test('compact at 320 width textScale 1.0', () {
      expect(
        QalaGoConsumerHeaderLogo.resolveHeight(
          width: 320,
          textScaleFactor: 1,
        ),
        QalaGoConsumerHeaderLogo.compactHeight,
      );
    });

    test('compact at 360 width textScale 2.0', () {
      expect(
        QalaGoConsumerHeaderLogo.resolveHeight(
          width: 360,
          textScaleFactor: 2,
        ),
        QalaGoConsumerHeaderLogo.compactHeight,
      );
    });
  });

  group('HomeHeaderSection branded header', () {
    Future<void> pumpHeader(
      WidgetTester tester, {
      required double width,
      required TextScaler textScaler,
      required Locale locale,
      required String cityName,
    }) async {
      tester.view.physicalSize = Size(width, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        wrapWithL10n(
          MediaQuery(
            data: MediaQueryData(
              size: Size(width, 640),
              textScaler: textScaler,
            ),
            child: SizedBox(
              width: width,
              child: HomeHeaderSection(
                cityName: cityName,
                unreadAsync: const AsyncValue.data(0),
                onCityTap: () {},
                onNotificationsTap: () {},
              ),
            ),
          ),
          locale: locale,
        ),
      );
      await tester.pumpAndSettle();
    }

    Image headerWordmarkImage(WidgetTester tester) {
      return tester.widget<Image>(
        find.descendant(
          of: find.byType(QalaGoConsumerHeaderLogo),
          matching: find.byType(Image),
        ),
      );
    }

    testWidgets('320 RU textScale 1.0 uses compact logo height', (tester) async {
      await pumpHeader(
        tester,
        width: 320,
        textScaler: TextScaler.noScaling,
        locale: const Locale('ru'),
        cityName: 'Уральск',
      );
      expect(tester.takeException(), isNull);
      final image = headerWordmarkImage(tester);
      expect(image.height, QalaGoConsumerHeaderLogo.compactHeight);
      expect(image.fit, BoxFit.contain);
    });

    testWidgets('320 KK textScale 2.0 avoids overflow', (tester) async {
      await pumpHeader(
        tester,
        width: 320,
        textScaler: const TextScaler.linear(2),
        locale: const Locale('kk'),
        cityName: 'Орал',
      );
      expect(tester.takeException(), isNull);
      final image = headerWordmarkImage(tester);
      expect(image.height, QalaGoConsumerHeaderLogo.compactHeight);
    });

    testWidgets('390 RU uses normal logo height', (tester) async {
      await pumpHeader(
        tester,
        width: 390,
        textScaler: TextScaler.noScaling,
        locale: const Locale('ru'),
        cityName: 'Уральск',
      );
      expect(tester.takeException(), isNull);
      final image = headerWordmarkImage(tester);
      expect(image.height, QalaGoConsumerHeaderLogo.normalHeight);
    });

    testWidgets('long city name ellipsizes without overflow', (tester) async {
      await pumpHeader(
        tester,
        width: 320,
        textScaler: TextScaler.noScaling,
        locale: const Locale('kk'),
        cityName: 'Өте ұзақ қала атауы мысалы тест',
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(HomeHeaderSection), findsOneWidget);
    });

    testWidgets('notification control meets 48dp minimum', (tester) async {
      await pumpHeader(
        tester,
        width: 320,
        textScaler: const TextScaler.linear(2),
        locale: const Locale('ru'),
        cityName: 'Уральск',
      );
      final iconButton = tester.getSize(find.byType(IconButton));
      expect(iconButton.width, greaterThanOrEqualTo(QalaGoTouchTargets.minInteractive));
      expect(iconButton.height, greaterThanOrEqualTo(QalaGoTouchTargets.minInteractive));
    });
  });
}
