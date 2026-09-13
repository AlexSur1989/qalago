import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/widgets/category_icon_tile.dart';

import '../support/l10n_test_harness.dart';

void main() {
  testWidgets('category tile shows label below icon area', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      wrapWithL10n(
        Scaffold(
          body: CategoryIconTile(
            label: 'Еда',
            onTap: () => tapped = true,
          ),
        ),
      ),
    );
    expect(find.text('Еда'), findsOneWidget);
    await tester.tap(find.text('Еда'));
    expect(tapped, isTrue);
  });

  testWidgets('more tile is not a backend category', (tester) async {
    await tester.pumpWidget(
      wrapWithL10n(Scaffold(body: CategoryMoreTile(onTap: () {}))),
    );
    expect(find.text('Ещё'), findsOneWidget);
  });
}
