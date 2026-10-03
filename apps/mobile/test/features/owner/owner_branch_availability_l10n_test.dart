import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/l10n/app_localizations_kk.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

void main() {
  test('RU branch availability labels', () {
    final l10n = AppLocalizationsRu();
    expect(l10n.ownerBranchAvailabilityModeAll, 'Все филиалы');
    expect(l10n.ownerBranchAvailabilityModeSelected, isNotEmpty);
    expect(l10n.ownerBranchAvailabilityAddBranchFirst, isNotEmpty);
  });

  test('KK branch availability labels', () {
    final l10n = AppLocalizationsKk();
    expect(l10n.ownerBranchAvailabilityModeAll, 'Барлық филиалдар');
    expect(l10n.ownerBranchAvailabilitySelectBranches, isNotEmpty);
  });
}
