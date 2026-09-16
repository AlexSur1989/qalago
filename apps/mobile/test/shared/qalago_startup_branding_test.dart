import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/shared/widgets/qalago_startup_surface.dart';

void main() {
  test('startup wordmark width targets ~36% of screen', () {
    expect(
      QalaGoStartupSurface.wordmarkWidthFor(
        const BoxConstraints(maxWidth: 320),
      ),
      120.0,
    );
    expect(
      QalaGoStartupSurface.wordmarkWidthFor(
        const BoxConstraints(maxWidth: 430),
      ),
      closeTo(154.8, 0.01),
    );
  });

  testWidgets('startup surface renders wordmark without overflow at 320',
      (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      const MediaQuery(
        data: MediaQueryData(size: Size(320, 640)),
        child: MaterialApp(home: QalaGoStartupSurface()),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.byType(Image), findsOneWidget);
  });
}
