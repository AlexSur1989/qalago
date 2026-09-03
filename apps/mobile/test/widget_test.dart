import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/app.dart';

void main() {
  testWidgets('QalaGo app smoke', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: QalaGoApp()));
    await tester.pumpAndSettle();
    expect(find.textContaining('QalaGo'), findsWidgets);
  });
}
