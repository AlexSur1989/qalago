import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/l10n/app_localizations_kk.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

void main() {
  test('RU review UX keys exist', () {
    final l10n = AppLocalizationsRu();
    expect(l10n.reviewsAll(3), contains('3'));
    expect(l10n.reviewCompanyReply, isNotEmpty);
    expect(l10n.reviewReportSubmit, isNotEmpty);
    expect(l10n.reviewDeleteBody, isNotEmpty);
  });

  test('KK review UX keys exist', () {
    final l10n = AppLocalizationsKk();
    expect(l10n.reviewsAll(2), isNotEmpty);
    expect(l10n.reviewReportSent, isNotEmpty);
    expect(l10n.reviewTextOptionalHint, isNotEmpty);
  });
}
