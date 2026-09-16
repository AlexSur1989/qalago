import 'package:shared_preferences/shared_preferences.dart';

import 'package:qalago_mobile/core/constants/app_constants.dart';
import 'package:qalago_mobile/core/locale/app_locale_notifier.dart';
import 'package:qalago_mobile/core/onboarding/onboarding_prefs.dart';

/// Seeds SharedPreferences so startup skips first-run onboarding.
Map<String, Object> returningUserOnboardingPrefs({
  bool completed = true,
  int version = OnboardingPrefs.currentVersion,
  String citySlug = AppConstants.defaultCitySlug,
  String localeCode = 'ru',
}) {
  return {
    OnboardingPrefs.completedKey: completed,
    OnboardingPrefs.versionKey: version,
    AppConstants.selectedCityKey: citySlug,
    kUiLocalePrefsKey: localeCode,
  };
}

Future<void> seedReturningUserOnboarding({
  String citySlug = AppConstants.defaultCitySlug,
  String localeCode = 'ru',
}) async {
  SharedPreferences.setMockInitialValues(
    returningUserOnboardingPrefs(citySlug: citySlug, localeCode: localeCode),
  );
  await SharedPreferences.getInstance();
}

Future<void> seedFirstLaunchOnboarding() async {
  SharedPreferences.setMockInitialValues({});
  await SharedPreferences.getInstance();
}
