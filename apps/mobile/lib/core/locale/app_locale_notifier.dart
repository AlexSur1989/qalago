import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const kUiLocalePrefsKey = 'qalago_ui_locale';

Locale resolveDeviceLocale() {
  final code = PlatformDispatcher.instance.locale.languageCode.toLowerCase();
  if (code.startsWith('kk')) return const Locale('kk');
  if (code.startsWith('ru')) return const Locale('ru');
  return const Locale('ru');
}

String localeToCode(Locale locale) =>
    locale.languageCode.startsWith('kk') ? 'kk' : 'ru';

class AppLocaleNotifier extends StateNotifier<Locale> {
  AppLocaleNotifier() : super(resolveDeviceLocale()) {
    _loadSaved();
  }

  Future<void> _loadSaved() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(kUiLocalePrefsKey);
    if (saved == 'kk') {
      state = const Locale('kk');
    } else if (saved == 'ru') {
      state = const Locale('ru');
    }
  }

  Future<void> setLocale(Locale locale) async {
    final normalized = locale.languageCode.startsWith('kk')
        ? const Locale('kk')
        : const Locale('ru');
    state = normalized;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(kUiLocalePrefsKey, normalized.languageCode);
  }
}

final appLocaleProvider =
    StateNotifierProvider<AppLocaleNotifier, Locale>((ref) => AppLocaleNotifier());
