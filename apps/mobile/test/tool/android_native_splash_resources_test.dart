import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('pre-12 launch background is solid QalaGo splash color only', () {
    for (final path in [
      'android/app/src/main/res/drawable/launch_background.xml',
      'android/app/src/main/res/drawable-v21/launch_background.xml',
    ]) {
      final xml = File(path).readAsStringSync();
      expect(xml, contains('@color/splash_background'));
      expect(xml, isNot(contains('bitmap')));
      expect(xml, isNot(contains('inset')));
      expect(xml, isNot(contains('ic_launcher')));
      expect(xml, isNot(contains('qalago_splash_wordmark')));
    }
  });

  test('legacy native splash wordmark PNG is not shipped', () {
    expect(
      File(
        'android/app/src/main/res/drawable-nodpi/qalago_splash_wordmark.png',
      ).existsSync(),
      isFalse,
    );
  });

  test('Android 12 splash uses brand icon not Flutter launcher', () {
    final styles = File(
      'android/app/src/main/res/values-v31/styles.xml',
    ).readAsStringSync();
    expect(styles, contains('@color/splash_background'));
    expect(styles, contains('splash_brand_icon'));
    expect(styles, isNot(contains('ic_launcher')));
    expect(styles, isNot(contains('qalago_splash_wordmark')));
  });
}
