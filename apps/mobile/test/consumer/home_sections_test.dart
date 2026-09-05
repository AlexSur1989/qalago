import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/ads/widgets/home_ad_slots.dart';

void main() {
  test('HOME_FEATURED consumer section uses distinct title', () {
    expect(homeFeaturedSectionTitle, 'Продвигаемые места');
    expect(homeFeaturedSectionTitle, isNot('Рекомендуем'));
  });
}
