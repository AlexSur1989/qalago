import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/constants/app_constants.dart';
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
  });
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}
