import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/theme/app_theme.dart';
import 'package:qalago_mobile/core/theme/qalago_foundation.dart';
import 'package:qalago_mobile/core/theme/theme_extensions.dart';

void main() {
  group('QalaGoColors', () {
    test('primary is canonical QalaGo blue #00A8D6', () {
      expect(QalaGoColors.primary, const Color(0xFF00A8D6));
      expect(AppTheme.kzBlue, QalaGoColors.primary);
    });

    test('brand accent gold is separate from semantic success', () {
      expect(QalaGoColors.brandAccentGold, const Color(0xFFFEC50C));
      expect(QalaGoColors.success, isNot(QalaGoColors.brandAccentGold));
    });

    test('legacy AppSemanticColors mirrors semantic feedback colors', () {
      expect(AppSemanticColors.success, QalaGoColors.success);
      expect(AppSemanticColors.warning, QalaGoColors.warning);
      expect(AppSemanticColors.info, QalaGoColors.info);
    });
  });

  group('QalaGoSpacing', () {
    test('scale and semantic aliases are consistent', () {
      expect(QalaGoSpacing.screenPadding, 20);
      expect(QalaGoSpacing.screenPaddingCompact, 16);
      expect(QalaGoSpacing.itemGap, QalaGoSpacing.space12);
    });
  });

  group('QalaGoRadius', () {
    test('matches AppTheme radius tokens', () {
      expect(QalaGoRadius.card, AppTheme.cardRadius);
      expect(QalaGoRadius.button, AppTheme.buttonRadius);
      expect(QalaGoRadius.input, AppTheme.inputRadius);
      expect(QalaGoRadius.chip, AppTheme.chipRadius);
    });
  });

  group('QalaGoTouchTargets', () {
    test('minimum interactive target is 48 logical px', () {
      expect(QalaGoTouchTargets.minInteractive, 48);
      expect(QalaGoTouchTargets.heroControl, greaterThanOrEqualTo(48));
    });
  });

  group('QalaGoTypography via theme', () {
    testWidgets('roles resolve under AppTheme.light', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light,
          home: Builder(
            builder: (context) {
              expect(context.pageTitleStyle.fontSize, 34);
              expect(context.pageTitleStyle.fontWeight, FontWeight.w900);
              expect(context.sectionTitleStyle.fontWeight, FontWeight.w700);
              expect(context.cardTitleStyle.fontWeight, FontWeight.w600);
              expect(context.buttonLabelStyle.fontWeight, FontWeight.w600);
              expect(
                context.navigationLabelStyle(selected: true).fontWeight,
                FontWeight.w800,
              );
              return const SizedBox.shrink();
            },
          ),
        ),
      );
    });
  });

  group('AppTheme.light', () {
    test('uses canonical primary in ColorScheme', () {
      expect(AppTheme.light.colorScheme.primary, QalaGoColors.primary);
    });

    test('filled button minimum height uses touch target', () {
      final minH = AppTheme.light.filledButtonTheme.style?.minimumSize?.resolve({})?.height;
      expect(minH, QalaGoTouchTargets.minInteractive);
    });

    test('card elevation matches foundation', () {
      expect(AppTheme.light.cardTheme.elevation, QalaGoElevation.card);
    });
  });

  group('QalaGoBreakpoints', () {
    test('compact and expanded helpers', () {
      expect(QalaGoBreakpoints.isCompactWidth(320), isTrue);
      expect(QalaGoBreakpoints.isCompactWidth(360), isFalse);
      expect(QalaGoBreakpoints.isExpandedWidth(600), isTrue);
    });
  });

  group('QalaGoMotion', () {
    test('featured carousel interval is defined', () {
      expect(QalaGoMotion.featuredCarouselInterval.inSeconds, 3);
    });
  });
}
