import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/constants/app_constants.dart';
import 'package:qalago_mobile/core/constants/dev_seed_accounts.dart';
import 'package:qalago_mobile/features/auth/presentation/dev_quick_login_panel.dart';
import 'package:qalago_mobile/features/auth/presentation/login_screen.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';

void main() {
  group('DEV login UI', () {
    testWidgets('hides "Войти без SMS" when QALAGO_DEV_LOGIN is false', (tester) async {
      expect(AppConstants.devLoginEnabled, isFalse);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
          ],
          child: const MaterialApp(home: LoginScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Войти без SMS'), findsNothing);
      expect(find.text('Получить код'), findsOneWidget);
    });

    testWidgets('hides dev quick login panel when flag is false', (tester) async {
      expect(AppConstants.devLoginEnabled, isFalse);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => _GuestAuthNotifier()),
          ],
          child: const MaterialApp(home: DevQuickLoginPanel()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('DEV: быстрый вход без SMS'), findsNothing);
      for (final account in devSeedAccounts) {
        expect(find.text(account.label), findsNothing);
      }
    });
  });
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}
