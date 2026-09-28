import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const kUiLocalePrefsKey = 'qalago_ui_locale';

/// QalaGo product default when the user has not explicitly chosen a language (KZ-C.1B).
const kQalagoProductDefaultLocale = Locale('kk');

/// Reads an explicit saved UI locale (`kk` / `ru`). Absent or invalid → null (no explicit choice).
Locale? parseExplicitUiLocalePreference(String? saved) {
  if (saved == 'kk') return const Locale('kk');
  if (saved == 'ru') return const Locale('ru');
  return null;
}

String localeToCode(Locale locale) =>
    locale.languageCode.startsWith('kk') ? 'kk' : 'ru';

class AppLocaleNotifier extends StateNotifier<Locale> {
  AppLocaleNotifier() : super(kQalagoProductDefaultLocale) {
    _initialHydration = _loadSaved();
  }

  late final Future<void> _initialHydration;

  /// Incremented on every explicit [setLocale]; stale hydration must not win.
  int _explicitLocaleWriteCount = 0;

  @visibleForTesting
  Future<void> get initialHydration => _initialHydration;

  Future<void> _loadSaved() async {
    final explicitWritesAtStart = _explicitLocaleWriteCount;
    final prefs = await SharedPreferences.getInstance();
    if (_explicitLocaleWriteCount != explicitWritesAtStart) {
      return;
    }
    final explicit = parseExplicitUiLocalePreference(
      prefs.getString(kUiLocalePrefsKey),
    );
    state = explicit ?? kQalagoProductDefaultLocale;
  }

  Future<void> setLocale(Locale locale) async {
    final normalized = locale.languageCode.startsWith('kk')
        ? const Locale('kk')
        : const Locale('ru');
    _explicitLocaleWriteCount++;
    state = normalized;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(kUiLocalePrefsKey, normalized.languageCode);
  }
}

final appLocaleProvider =
    StateNotifierProvider<AppLocaleNotifier, Locale>((ref) => AppLocaleNotifier());
