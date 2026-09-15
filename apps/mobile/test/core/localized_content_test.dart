import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/locale/localized_content.dart';

void main() {
  test('city RU and KK from API fields', () {
    expect(
      cityDisplayName(localeCode: 'ru', nameRu: 'Уральск', nameKk: 'Орал'),
      'Уральск',
    );
    expect(
      cityDisplayName(localeCode: 'kk', nameRu: 'Уральск', nameKk: 'Орал'),
      'Орал',
    );
  });

  test('city KK fallback to RU', () {
    expect(
      cityDisplayName(localeCode: 'kk', nameRu: 'Уральск', nameKk: null),
      'Уральск',
    );
  });

  test('business-authored text unchanged when KK missing', () {
    expect(
      businessAuthoredText(localeCode: 'kk', primary: 'Coffee Boom', kk: null),
      'Coffee Boom',
    );
  });

  test('service item PATCH isolation concept', () {
    expect(
      serviceItemTitle(localeCode: 'ru', title: 'RU', titleKk: 'KK'),
      'RU',
    );
    expect(
      serviceItemTitle(localeCode: 'kk', title: 'RU', titleKk: 'KK'),
      'KK',
    );
  });
}
