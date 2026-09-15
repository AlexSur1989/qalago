import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

void main() {
  test('HOME_FEATURED consumer section uses distinct title', () {
    final ru = lookupAppLocalizations(const Locale('ru'));
    expect(ru.categorySponsored, 'Продвигаемые места');
    expect(ru.categorySponsored, isNot('Рекомендуем'));
  });
}
