import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('RU owner review report labels', () async {
    final l10n = await AppLocalizations.delegate.load(const Locale('ru'));
    expect(l10n.ownerReviewReportAction, 'Пожаловаться на отзыв');
    expect(l10n.ownerReviewReportSubmit, 'Отправить жалобу');
    expect(l10n.ownerReviewReportSent, 'Жалоба отправлена');
    expect(l10n.ownerReviewReportAlreadySubmitted, 'Жалоба уже отправлена');
  });

  test('KK owner review report labels', () async {
    final l10n = await AppLocalizations.delegate.load(const Locale('kk'));
    expect(l10n.ownerReviewReportAction, 'Пікірге шағымдану');
    expect(l10n.ownerReviewReportSubmit, 'Шағымды жіберу');
    expect(l10n.ownerReviewReportSent, 'Шағым жіберілді');
  });
}
