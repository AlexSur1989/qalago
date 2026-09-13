import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_locale_notifier.dart';

export 'app_locale_notifier.dart';

final appLocaleCodeProvider = Provider<String>((ref) {
  return localeToCode(ref.watch(appLocaleProvider));
});

String resolveLocaleCode(String code) {
  return code.startsWith('kk') ? 'kk' : 'ru';
}
