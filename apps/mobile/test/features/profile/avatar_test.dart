import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/providers/city_provider.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_edit_screen.dart';
import 'package:qalago_mobile/features/profile/presentation/profile_edit_strings.dart';
import 'package:qalago_mobile/shared/models/models.dart';

void main() {
  testWidgets('profile edit shows initials when no avatar', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith(() => _UserAuthNotifier(hasAvatar: false)),
          cityProvider.overrideWith(() => _FixedCityNotifier()),
        ],
        child: const MaterialApp(home: ProfileEditScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('A'), findsOneWidget);
    expect(find.text('Изменить фото'), findsOneWidget);
  });

  testWidgets('profile edit shows change photo when avatar set', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith(() => _UserAuthNotifier(hasAvatar: true)),
          cityProvider.overrideWith(() => _FixedCityNotifier()),
        ],
        child: const MaterialApp(home: ProfileEditScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('A'), findsNothing);
    expect(
      find.text(
        ProfileEditStrings.label(ProfileEditStrings.changePhoto),
      ),
      findsOneWidget,
    );
  });
}

class _UserAuthNotifier extends AuthNotifier {
  _UserAuthNotifier({required this.hasAvatar});

  final bool hasAvatar;

  @override
  AuthState build() {
    return AuthState(
      isAuthenticated: true,
      user: UserModel(
        id: 'u1',
        name: 'Alex',
        phone: '+77001234567',
        role: 'USER',
        avatarUrl: hasAvatar ? '/uploads/a.jpg' : null,
      ),
    );
  }
}

class _FixedCityNotifier extends CityNotifier {
  @override
  CityState build() =>
      const CityState(slug: 'uralsk', nameRu: 'Уральск', launchStatus: 'LIVE');
}
