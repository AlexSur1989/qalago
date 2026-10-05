import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Mobile monetization purchase route gates (6.18L.1A)', () {
    final root = Directory.current.path;
    final lib = '$root/lib/features/owner/monetization/presentation';

    String read(String name) =>
        File('$lib/$name').readAsStringSync();

    test('product detail deep link fails closed when ads purchase disabled', () {
      expect(read('promote_product_screen.dart'), contains('canPurchaseAdsProvider'));
      expect(read('promote_product_screen.dart'), contains('MonetizationPurchasesUnavailableBody'));
    });

    test('package and confirm routes fail closed', () {
      expect(read('promote_package_screen.dart'), contains('canPurchaseAdsProvider'));
      expect(read('monetization_order_confirm_screen.dart'), contains('canPurchaseAdsProvider'));
      expect(read('vip_creative_screen.dart'), contains('canPurchaseAdsProvider'));
    });
  });
}
