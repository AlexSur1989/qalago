import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'onboarding_prefs.dart';

enum OnboardingGate { loading, requiresOnboarding, completed }

class OnboardingSnapshot {
  const OnboardingSnapshot({required this.gate});

  final OnboardingGate gate;

  bool get requiresOnboarding => gate == OnboardingGate.requiresOnboarding;
}

OnboardingSnapshot readOnboardingFromPrefs(SharedPreferences prefs) {
  final completed = prefs.getBool(OnboardingPrefs.completedKey) ?? false;
  final version = prefs.getInt(OnboardingPrefs.versionKey) ?? 0;
  if (!completed || version < OnboardingPrefs.currentVersion) {
    return const OnboardingSnapshot(gate: OnboardingGate.requiresOnboarding);
  }
  return const OnboardingSnapshot(gate: OnboardingGate.completed);
}

class OnboardingNotifier extends AsyncNotifier<OnboardingSnapshot> {
  @override
  Future<OnboardingSnapshot> build() async {
    final prefs = await SharedPreferences.getInstance();
    return readOnboardingFromPrefs(prefs);
  }

  Future<void> markCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(OnboardingPrefs.completedKey, true);
    await prefs.setInt(OnboardingPrefs.versionKey, OnboardingPrefs.currentVersion);
    state = const AsyncData(
      OnboardingSnapshot(gate: OnboardingGate.completed),
    );
  }

  /// Clears completion (tests / version bump simulation only).
  @visibleForTesting
  Future<void> resetForTesting() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(OnboardingPrefs.completedKey);
    await prefs.remove(OnboardingPrefs.versionKey);
    ref.invalidateSelf();
  }
}

final onboardingProvider =
    AsyncNotifierProvider<OnboardingNotifier, OnboardingSnapshot>(
  OnboardingNotifier.new,
);
