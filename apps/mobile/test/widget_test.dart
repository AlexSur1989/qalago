import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/app.dart';

void main() {
  testWidgets('QalaGo app smoke', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: QalaGoApp()));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Поиск заведений и услуг...'), findsOneWidget);
  });
}
