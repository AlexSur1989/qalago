import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/theme/app_theme.dart';
import 'package:qalago_mobile/core/theme/qalago_touch_targets.dart';
import 'package:qalago_mobile/shared/widgets/qalago_button.dart';
import 'package:qalago_mobile/shared/widgets/qalago_empty_state.dart';
import 'package:qalago_mobile/shared/widgets/qalago_icon_button.dart';
import 'package:qalago_mobile/shared/widgets/qalago_page_title.dart';
import 'package:qalago_mobile/shared/widgets/qalago_search_field.dart';
import 'package:qalago_mobile/shared/widgets/qalago_section_header.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/shared/widgets/error_view.dart';

import '../support/l10n_test_harness.dart';

Widget _wrap(Widget child, {double width = 390, TextScaler textScaler = TextScaler.noScaling}) {
  return MaterialApp(
    theme: AppTheme.light,
    locale: const Locale('ru'),
    localizationsDelegates: l10nDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: MediaQuery(
      data: MediaQueryData(size: Size(width, 800), textScaler: textScaler),
      child: Scaffold(
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: SizedBox(width: width - 32, child: child),
        ),
      ),
    ),
  );
}

void main() {
  group('QalaGoButton', () {
    testWidgets('primary enabled at 320px', (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 480));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      var tapped = false;
      await tester.pumpWidget(
        _wrap(
          QalaGoButton(label: 'Сохранить', onPressed: () => tapped = true),
          width: 320,
        ),
      );
      await tester.tap(find.text('Сохранить'));
      expect(tapped, isTrue);
    });

    testWidgets('disabled primary', (tester) async {
      await tester.pumpWidget(
        _wrap(const QalaGoButton(label: 'Off', onPressed: null)),
      );
      expect(tester.widget<FilledButton>(find.byType(FilledButton)).onPressed, isNull);
    });

    testWidgets('loading shows progress', (tester) async {
      await tester.pumpWidget(
        _wrap(
          QalaGoButton(
            label: 'Жіберу',
            loading: true,
            onPressed: () {},
          ),
        ),
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('long KK label wraps at 1.3 text scale', (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 600));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        _wrap(
          const QalaGoButton(
            label: 'Қоңырау шалу және бағыт алу',
            onPressed: _noop,
          ),
          width: 320,
          textScaler: TextScaler.linear(1.3),
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.textContaining('Қоңырау'), findsOneWidget);
    });

    testWidgets('destructive uses error colors', (tester) async {
      await tester.pumpWidget(
        _wrap(
          QalaGoButton(
            label: 'Delete',
            variant: QalaGoButtonVariant.destructive,
            onPressed: () {},
          ),
        ),
      );
      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      final bg = button.style?.backgroundColor?.resolve({});
      expect(bg, AppTheme.light.colorScheme.error);
    });
  });

  group('QalaGoIconButton', () {
    testWidgets('exposes semantics label', (tester) async {
      await tester.pumpWidget(
        _wrap(
          QalaGoIconButton(
            icon: Icons.close,
            semanticsLabel: 'Очистить',
            onPressed: () {},
          ),
        ),
      );

      expect(find.bySemanticsLabel('Очистить'), findsOneWidget);
    });

    testWidgets('hit target at least 48', (tester) async {
      await tester.pumpWidget(
        _wrap(
          QalaGoIconButton(
            icon: Icons.search,
            semanticsLabel: 'Search',
            onPressed: () {},
          ),
        ),
      );
      final box = tester.getSize(find.byType(QalaGoIconButton));
      expect(box.width, greaterThanOrEqualTo(QalaGoTouchTargets.minInteractive));
      expect(box.height, greaterThanOrEqualTo(QalaGoTouchTargets.minInteractive));
    });
  });

  group('QalaGoPageTitle', () {
    testWidgets('wraps long title with header semantics', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const QalaGoPageTitle(text: 'Таңдаулылар мен сүйікті орындар'),
          width: 320,
          textScaler: TextScaler.linear(2),
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.text('Таңдаулылар мен сүйікті орындар'), findsOneWidget);
    });
  });

  group('QalaGoSectionHeader', () {
    testWidgets('title and action at 360', (tester) async {
      await tester.pumpWidget(
        _wrap(
          QalaGoSectionHeader(
            title: 'Рекомендуем рядом',
            action: TextButton(onPressed: () {}, child: const Text('Все')),
          ),
          width: 360,
        ),
      );
      expect(find.text('Рекомендуем рядом'), findsOneWidget);
    });
  });

  group('QalagoSearchField', () {
    testWidgets('clear button semantics when onClear set', (tester) async {
      final controller = TextEditingController(text: 'test');
      addTearDown(controller.dispose);

      await tester.pumpWidget(
        _wrap(
          QalagoSearchField(
            controller: controller,
            onClear: () => controller.clear(),
            clearSemanticsLabel: 'Очистить',
          ),
          width: 430,
        ),
      );
      await tester.pump();

      expect(find.bySemanticsLabel('Очистить'), findsOneWidget);
    });
  });

  group('QalaGoEmptyState', () {
    testWidgets('title and CTA at 390', (tester) async {
      await tester.pumpWidget(
        _wrap(
          QalaGoEmptyState(
            title: 'Пока пусто',
            description: 'Добавьте избранное из каталога',
            actionLabel: 'На главную',
            onAction: () {},
          ),
          width: 390,
        ),
      );
      expect(find.text('Пока пусто'), findsOneWidget);
      expect(find.text('На главную'), findsOneWidget);
    });
  });

  group('ErrorView', () {
    testWidgets('retry semantics', (tester) async {
      await tester.pumpWidget(
        _wrap(
          ErrorView(message: 'Ошибка загрузки', onRetry: () {}),
          width: 320,
        ),
      );

      expect(find.text('Повторить'), findsOneWidget);
      expect(find.byType(FilledButton), findsOneWidget);
    });
  });
}

void _noop() {}
