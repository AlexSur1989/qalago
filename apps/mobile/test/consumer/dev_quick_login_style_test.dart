import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/constants/app_constants.dart';
import 'package:qalago_mobile/core/constants/dev_seed_accounts.dart';
import 'package:qalago_mobile/core/theme/app_theme.dart';
import 'package:qalago_mobile/features/auth/presentation/dev_quick_login_panel.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('DEV login visual alignment', () {
    testWidgets('all four account buttons use the same primary ColorScheme style',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light,
          home: Scaffold(
            body: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final account in devSeedAccounts)
                  DevQuickLoginAccountButton(
                    label: account.label,
                    onPressed: () {},
                  ),
              ],
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(FilledButton), findsNWidgets(4));
      for (final account in devSeedAccounts) {
        expect(find.text(account.label), findsOneWidget);
      }

      final scheme = AppTheme.light.colorScheme;
      final elements = tester.elementList(find.byType(FilledButton));
      final backgrounds = tester
          .widgetList<FilledButton>(find.byType(FilledButton))
          .map((button) {
        final style = button.style ??
            DevQuickLoginAccountButton.buttonStyle(elements.first);
        return style.backgroundColor?.resolve(const <WidgetState>{});
      }).toList();

      expect(backgrounds.every((c) => c == scheme.primary), isTrue);
    });

    testWidgets('DevQuickLoginPanel keeps Wrap on narrow screens', (tester) async {
      if (!AppConstants.devLoginEnabled) return;

      await tester.binding.setSurfaceSize(const Size(320, 640));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
          ],
          child: MaterialApp(
            theme: AppTheme.light,
            home: const Scaffold(body: DevQuickLoginPanel()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(Wrap), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    if (AppConstants.devLoginEnabled) {
      testWidgets('panel shows four unified FilledButtons when DEV login enabled',
          (tester) async {
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              authProvider.overrideWith(() => _GuestAuthNotifier()),
            ],
            child: MaterialApp(
              theme: AppTheme.light,
              home: const Scaffold(body: DevQuickLoginPanel()),
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('DEV: быстрый вход без SMS'), findsOneWidget);
        expect(find.byType(FilledButton), findsNWidgets(4));
        expect(find.byType(Wrap), findsOneWidget);
      });
    }
  });
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}
