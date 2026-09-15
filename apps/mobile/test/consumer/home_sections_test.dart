import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
void main() {
  test('HOME_FEATURED consumer section uses distinct title', () {
    final ru = lookupAppLocalizations(const Locale('ru'));
    expect(ru.categorySponsored, 'Продвигаемые места');
    expect(ru.categorySponsored, isNot('Рекомендуем'));
  });

  test('Popular section uses truthful RU/KK labels', () {
    final ru = lookupAppLocalizations(const Locale('ru'));
    final kk = lookupAppLocalizations(const Locale('kk'));
    expect(ru.homePopularSection, 'Популярное');
    expect(kk.homePopularSection, 'Танымал');
    expect(ru.homePopularSection, isNot(ru.homeRecommendedSection));
  });
}
