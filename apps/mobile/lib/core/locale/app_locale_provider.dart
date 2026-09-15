import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_locale_notifier.dart';

export 'app_locale_notifier.dart';

import '../providers/city_provider.dart';
import 'localized_content.dart';

final cityLocalizedNameProvider = Provider<String>((ref) {
  final city = ref.watch(cityProvider);
  final locale = ref.watch(appLocaleCodeProvider);
  return cityDisplayName(
    localeCode: locale,
    nameRu: city.nameRu,
    nameKk: city.nameKk,
  );
});

final appLocaleCodeProvider = Provider<String>((ref) {
  return localeToCode(ref.watch(appLocaleProvider));
});

String resolveLocaleCode(String code) {
  return code.startsWith('kk') ? 'kk' : 'ru';
}
