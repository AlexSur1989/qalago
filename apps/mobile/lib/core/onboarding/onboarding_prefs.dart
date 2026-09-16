/// First-run onboarding persistence (SharedPreferences).
class OnboardingPrefs {
  OnboardingPrefs._();

  static const completedKey = 'qalago_onboarding_completed';
  static const versionKey = 'qalago_onboarding_version';

  /// Bump when onboarding flow or requirements change (not app semver).
  static const currentVersion = 1;
}
