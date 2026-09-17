import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('launch backgrounds use QalaGo splash not Flutter ic_launcher', () {
    for (final path in [
      'android/app/src/main/res/drawable/launch_background.xml',
      'android/app/src/main/res/drawable-v21/launch_background.xml',
    ]) {
      final xml = File(path).readAsStringSync();
      expect(xml, contains('@color/splash_background'));
      expect(xml, contains('qalago_splash_wordmark'));
      expect(xml, isNot(contains('ic_launcher')));
      expect(xml, contains('inset'));
    }
  });

  test('Android 12 splash uses brand icon not Flutter launcher', () {
    final styles = File(
      'android/app/src/main/res/values-v31/styles.xml',
    ).readAsStringSync();
    expect(styles, contains('@color/splash_background'));
    expect(styles, contains('splash_brand_icon'));
    expect(styles, isNot(contains('ic_launcher')));
  });
}
