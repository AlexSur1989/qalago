import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';
import 'package:qalago_mobile/l10n/app_localizations_kk.dart';

void main() {
  test('RU legal acceptance gate strings present', () {
    final ru = AppLocalizationsRu();
    expect(ru.legalAcceptanceTitle, isNotEmpty);
    expect(ru.legalAcceptanceCheckbox, contains('Условия'));
    expect(ru.legalAcceptanceContinue, isNotEmpty);
  });

  test('KK legal acceptance gate strings present', () {
    final kk = AppLocalizationsKk();
    expect(kk.legalAcceptanceTitle, isNotEmpty);
    expect(kk.legalAcceptanceCheckbox, contains('шарт'));
    expect(kk.legalAcceptanceContinue, isNotEmpty);
  });
}
