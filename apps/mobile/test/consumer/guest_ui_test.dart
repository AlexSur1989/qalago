import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/favorites/presentation/favorites_screen.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_screen.dart';
import 'package:qalago_mobile/shared/widgets/business_card.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  testWidgets('guest profile shows login CTA', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith(() => _GuestAuthNotifier()),
          cityProvider.overrideWith(() => _FixedCityNotifier()),
        ],
        child: const MaterialApp(home: ProfileScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Войдите в QalaGo'), findsOneWidget);
    expect(find.text('Войти'), findsOneWidget);
    expect(find.text('Кабинет бизнеса'), findsNothing);
  });

  testWidgets('guest favorites shows login prompt', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith(() => _GuestAuthNotifier()),
          cityProvider.overrideWith(() => _FixedCityNotifier()),
        ],
        child: const MaterialApp(home: FavoritesScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Войдите, чтобы сохранять избранное'), findsOneWidget);
    expect(find.text('Войти'), findsOneWidget);
  });

  testWidgets('organic business card does not show plan tier badge', (tester) async {
    final business = BusinessModel(
      id: 'b1',
      title: 'VIP Place',
      slug: 'vip',
      address: 'Street 1',
      planTier: 'VIP',
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: BusinessCard(business: business),
        ),
      ),
    );

    expect(find.text('VIP'), findsNothing);
  });
}

class _GuestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(isLoading: false);
}

class _FixedCityNotifier extends CityNotifier {
  @override
  CityState build() =>
      const CityState(slug: 'uralsk', nameRu: 'Уральск', launchStatus: 'LIVE');
}
