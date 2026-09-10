import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/theme/app_theme.dart';
import 'package:qalago_mobile/features/auth/presentation/dev_quick_login_panel.dart';
import 'package:qalago_mobile/shared/models/models.dart';
import 'package:qalago_mobile/shared/widgets/business_card.dart';
import 'package:qalago_mobile/shared/widgets/error_view.dart';

Widget _themed(Widget child) {
  return MaterialApp(theme: AppTheme.light, home: Scaffold(body: child));
}

void main() {
  testWidgets('FilledButton uses theme primary in widget tree', (tester) async {
    await tester.pumpWidget(
      _themed(
        FilledButton(onPressed: () {}, child: const Text('CTA')),
      ),
    );
    expect(find.text('CTA'), findsOneWidget);
    expect(
      AppTheme.light.filledButtonTheme.style?.backgroundColor?.resolve({}),
      AppTheme.kzBlue,
    );
  });

  testWidgets('OutlinedButton renders with theme', (tester) async {
    await tester.pumpWidget(
      _themed(
        OutlinedButton(onPressed: () {}, child: const Text('Secondary')),
      ),
    );
    expect(find.text('Secondary'), findsOneWidget);
  });

  testWidgets('Disabled FilledButton is present', (tester) async {
    await tester.pumpWidget(
      _themed(
        const FilledButton(onPressed: null, child: Text('Disabled')),
      ),
    );
    expect(find.text('Disabled'), findsOneWidget);
  });

  testWidgets('TextButton renders with theme', (tester) async {
    await tester.pumpWidget(
      _themed(
        TextButton(onPressed: () {}, child: const Text('Tertiary')),
      ),
    );
    expect(find.text('Tertiary'), findsOneWidget);
  });

  testWidgets('Card theme radius is applied globally', (tester) async {
    await tester.pumpWidget(_themed(const SizedBox.shrink()));
    final radius = AppTheme.light.cardTheme.shape is RoundedRectangleBorder
        ? (AppTheme.light.cardTheme.shape! as RoundedRectangleBorder).borderRadius
        : null;
    expect(radius, BorderRadius.circular(AppTheme.cardRadius));
  });

  testWidgets('InputDecorationTheme is filled', (tester) async {
    expect(AppTheme.light.inputDecorationTheme.filled, isTrue);
  });

  testWidgets('AppBar theme defines title weight', (tester) async {
    expect(
      AppTheme.light.appBarTheme.titleTextStyle?.fontWeight,
      FontWeight.w700,
    );
  });

  testWidgets('DEV Login account button uses theme', (tester) async {
    await tester.pumpWidget(
      _themed(
        DevQuickLoginAccountButton(label: 'Owner', onPressed: () {}),
      ),
    );
    expect(find.text('Owner'), findsOneWidget);
  });

  testWidgets('ErrorView uses card and retry button', (tester) async {
    await tester.pumpWidget(
      _themed(ErrorView(message: 'Oops', onRetry: () {})),
    );
    expect(find.byType(Card), findsOneWidget);
    expect(find.text('Повторить'), findsOneWidget);
  });

  testWidgets('BusinessCard fits narrow width', (tester) async {
    await tester.binding.setSurfaceSize(const Size(320, 480));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      _themed(
        BusinessCard(
          business: BusinessModel(
            id: '1',
            title: 'Test Cafe',
            slug: 'test',
            address: 'Street 1',
          ),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
  });
}
