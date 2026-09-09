import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_provider.dart';
import '../data/onboarding_repository.dart';

final onboardingRepositoryProvider = Provider(
  (ref) => OnboardingRepository(ref.watch(dioProvider)),
);

final myApplicationsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(onboardingRepositoryProvider).fetchMyApplications(),
);

final myClaimsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(onboardingRepositoryProvider).fetchMyClaims(),
);

final applicationDetailProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, String>((ref, id) {
  return ref.watch(onboardingRepositoryProvider).getApplication(id);
});

final claimForBusinessProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>?, String>((ref, businessId) async {
  final claims = await ref.watch(myClaimsProvider.future);
  for (final claim in claims) {
    if (claim['businessId'] == businessId) return claim;
    final business = claim['business'] as Map<String, dynamic>?;
    if (business?['id'] == businessId) return claim;
  }
  return null;
});

void invalidateOnboardingProviders(Ref ref) {
  ref.invalidate(myApplicationsProvider);
  ref.invalidate(myClaimsProvider);
}
