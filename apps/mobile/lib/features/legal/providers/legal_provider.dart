import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/network/dio_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/legal_repository.dart';

final legalRepositoryProvider = Provider(
  (ref) => LegalRepository(ref.watch(dioProvider)),
);

final legalCurrentProvider = FutureProvider<LegalCurrentState?>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuthenticated) return null;
  final role = auth.user?.role;
  if (role != 'USER' && role != 'BUSINESS') {
    return null;
  }
  final locale = ref.watch(appLocaleCodeProvider);
  return ref.watch(legalRepositoryProvider).fetchCurrent(localeCode: locale);
});

final legalAcceptanceRequiredProvider = Provider<bool>((ref) {
  final auth = ref.watch(authProvider);
  if (!auth.isAuthenticated) return false;
  final role = auth.user?.role;
  if (role != 'USER' && role != 'BUSINESS') return false;
  final async = ref.watch(legalCurrentProvider);
  return async.when(
    data: (state) => state?.acceptanceRequired ?? false,
    loading: () => true,
    error: (_, __) => true,
  );
});

void invalidateLegalProviders(WidgetRef ref) {
  ref.invalidate(legalCurrentProvider);
}
