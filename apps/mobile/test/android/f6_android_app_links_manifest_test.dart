import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Static inspection of F.6 Phase 4 Android App Links manifest contract.
void main() {
  late String manifest;

  setUpAll(() {
    final path = Platform.isWindows
        ? r'android\app\src\main\AndroidManifest.xml'
        : 'android/app/src/main/AndroidManifest.xml';
    manifest = File(path).readAsStringSync();
  });

  test('https scheme and qalago.kz host with autoVerify', () {
    expect(manifest, contains('android:autoVerify="true"'));
    expect(manifest, contains('android:scheme="https"'));
    expect(manifest, contains('android:host="qalago.kz"'));
  });

  test('RU and KK locale path prefixes', () {
    expect(manifest, contains('android:pathPrefix="/ru"'));
    expect(manifest, contains('android:pathPrefix="/kk"'));
  });

  test('VIEW browsable intent categories', () {
    expect(manifest, contains('android.intent.action.VIEW'));
    expect(manifest, contains('android.intent.category.BROWSABLE'));
    expect(manifest, contains('android.intent.category.DEFAULT'));
  });

  test('does not claim http, www, or custom schemes for App Links', () {
    expect(manifest.contains('android:scheme="http"'), isFalse);
    expect(manifest.contains('android:host="www.qalago.kz"'), isFalse);
    expect(manifest.contains('android:scheme="qalago"'), isFalse);
  });

  test('Flutter engine deep linking disabled for app_links', () {
    expect(manifest, contains('flutter_deeplinking_enabled'));
    expect(manifest, contains('android:value="false"'));
  });

  test('MainActivity remains exported singleTop', () {
    expect(manifest, contains('android:name=".MainActivity"'));
    expect(manifest, contains('android:exported="true"'));
    expect(manifest, contains('android:launchMode="singleTop"'));
  });
}
