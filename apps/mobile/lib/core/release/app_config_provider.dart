import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/dio_provider.dart';
import 'app_config_models.dart';
import 'app_config_repository.dart';
import 'semver.dart';

final appConfigRepositoryProvider = Provider(
  (ref) => AppConfigRepository(ref.watch(dioProvider)),
);

class AppReleaseGateState {
  const AppReleaseGateState({
    required this.loading,
    this.config,
    this.error,
  });

  final bool loading;
  final AppConfigSnapshot? config;
  final Object? error;

  bool get maintenance => config?.maintenanceEnabled == true;
  ClientUpdateMode get updateMode => config?.updateMode ?? ClientUpdateMode.none;
}

class AppReleaseGateNotifier extends AsyncNotifier<AppReleaseGateState> {
  @override
  Future<AppReleaseGateState> build() async {
    final repo = ref.read(appConfigRepositoryProvider);
    final config = await repo.loadEffective();
    return AppReleaseGateState(loading: false, config: config);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(appConfigRepositoryProvider);
      final config = await repo.loadEffective();
      return AppReleaseGateState(loading: false, config: config);
    });
  }
}

final appReleaseGateProvider =
    AsyncNotifierProvider<AppReleaseGateNotifier, AppReleaseGateState>(
  AppReleaseGateNotifier.new,
);

final featureFlagsProvider = Provider<Map<String, bool>>((ref) {
  final gate = ref.watch(appReleaseGateProvider).valueOrNull;
  return gate?.config?.featureFlags ?? const {};
});

final subcategoriesEnabledProvider = Provider<bool>((ref) {
  final flags = ref.watch(featureFlagsProvider);
  return flags['subcategoriesEnabled'] == true;
});
