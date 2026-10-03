import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';
import 'package:qalago_mobile/l10n/app_localizations_kk.dart';

void main() {
  test('RU owner location labels exist', () {
    final l10n = AppLocalizationsRu();
    expect(l10n.ownerLocationsTitle, 'Филиалы');
    expect(l10n.ownerLocationAdd, isNotEmpty);
    expect(l10n.ownerLocationErrorLastDelete, isNotEmpty);
  });

  test('KK owner location labels exist', () {
    final l10n = AppLocalizationsKk();
    expect(l10n.ownerLocationsTitle, 'Филиалдар');
    expect(l10n.ownerLocationAdd, isNotEmpty);
    expect(l10n.ownerLocationErrorPrimaryDelete, isNotEmpty);
  });
}
