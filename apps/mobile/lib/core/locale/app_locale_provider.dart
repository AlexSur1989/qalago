import 'package:flutter_riverpod/flutter_riverpod.dart';

/// UI locale code for consumer-facing labels (`ru` | `kk`).
/// Profile language switch can override this provider later.
final appLocaleCodeProvider = StateProvider<String>((ref) => 'ru');

String resolveLocaleCode(String code) {
  return code.startsWith('kk') ? 'kk' : 'ru';
}
