import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/widgets/business_card.dart';

import '../support/l10n_test_harness.dart';

BusinessModel _sampleBusiness({
  String title = 'QalaGo Coffee House With A Very Long Name',
  String address = 'Abay Avenue 123, Uralsk',
  int? distanceMeters,
  String? categoryTitle = 'Кофейни',
  String? shortDesc,
  String? coverImageUrl,
}) {
  return BusinessModel(
    id: 'biz-1',
    title: title,
    slug: 'coffee',
    address: address,
    distanceMeters: distanceMeters,
    categoryTitle: categoryTitle,
    shortDesc: shortDesc,
    coverImageUrl: coverImageUrl,
  );
}

Future<void> _pumpCard(
  WidgetTester tester,
  Widget card, {
  Locale locale = const Locale('ru'),
  double width = 320,
  TextScaler textScaler = TextScaler.noScaling,
}) async {
  await tester.binding.setSurfaceSize(Size(width, 800));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  await tester.pumpWidget(
    wrapWithL10n(
      MediaQuery(
        data: MediaQueryData(
          size: Size(width, 800),
          textScaler: textScaler,
        ),
        child: Scaffold(body: SingleChildScrollView(child: card)),
      ),
      locale: locale,
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  group('BusinessCard layouts', () {
    testWidgets('standard shows title and category without overflow at 320',
        (tester) async {
      await _pumpCard(
        tester,
        BusinessCard(business: _sampleBusiness(shortDesc: 'Fresh roast daily')),
      );
      expect(tester.takeException(), isNull);
      expect(find.text('QalaGo Coffee House With A Very Long Name'), findsOneWidget);
      expect(find.text('Кофейни'), findsOneWidget);
    });

    testWidgets('standard sponsored shows disclosure', (tester) async {
      await _pumpCard(
        tester,
        BusinessCard(
          business: _sampleBusiness(),
          sponsored: true,
        ),
      );
      expect(find.text('Реклама'), findsOneWidget);
    });

    testWidgets('compactHorizontal at 320 RU textScale 2.0', (tester) async {
      await _pumpCard(
        tester,
        BusinessCard(
          business: _sampleBusiness(
            distanceMeters: 450,
            shortDesc: 'Espresso and pastries',
          ),
          layout: BusinessCardLayout.compactHorizontal,
        ),
        textScaler: const TextScaler.linear(2.0),
      );
      expect(tester.takeException(), isNull);
      expect(find.byIcon(Icons.storefront_outlined), findsOneWidget);
    });

    testWidgets('compactVertical shows subtitle without favorite icon',
        (tester) async {
      await _pumpCard(
        tester,
        SizedBox(
          width: 168,
          child: BusinessCard(
            business: _sampleBusiness(coverImageUrl: null),
            layout: BusinessCardLayout.compactVertical,
            subtitle: 'Популярно в городе',
          ),
        ),
        width: 360,
      );
      expect(find.byIcon(Icons.favorite_border), findsNothing);
      expect(find.text('Популярно в городе'), findsOneWidget);
    });

    testWidgets('no image uses storefront placeholder', (tester) async {
      await _pumpCard(
        tester,
        BusinessCard(business: _sampleBusiness(coverImageUrl: null)),
      );
      expect(find.byIcon(Icons.storefront_outlined), findsOneWidget);
    });

    testWidgets('tap invokes onTap', (tester) async {
      var tapped = false;
      await _pumpCard(
        tester,
        BusinessCard(
          business: _sampleBusiness(),
          onTap: () => tapped = true,
        ),
      );
      await tester.tap(find.byType(BusinessCard));
      expect(tapped, isTrue);
    });

    testWidgets('KK locale compact vertical', (tester) async {
      await _pumpCard(
        tester,
        SizedBox(
          width: 168,
          height: 194,
          child: BusinessCard(
            business: _sampleBusiness(
              title:
                  'Ресторан с очень длинным названием заведения в центре города',
              categoryTitle: 'Кофехана',
            ),
            layout: BusinessCardLayout.compactVertical,
            subtitle: 'Популярно сейчас среди посетителей города',
          ),
        ),
        locale: const Locale('kk'),
        width: 320,
        textScaler: const TextScaler.linear(2.0),
      );
      expect(tester.takeException(), isNull);
    });
  });
}
