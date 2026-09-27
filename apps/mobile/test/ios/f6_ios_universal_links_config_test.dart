import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Static inspection of F.6 Phase 5 iOS Universal Links configuration.
void main() {
  late String entitlements;
  late String infoPlist;
  late String pbxproj;

  setUpAll(() {
    final sep = Platform.pathSeparator;
    entitlements = File('ios${sep}Runner${sep}Runner.entitlements').readAsStringSync();
    infoPlist = File('ios${sep}Runner${sep}Info.plist').readAsStringSync();
    pbxproj = File('ios${sep}Runner.xcodeproj${sep}project.pbxproj').readAsStringSync();
  });

  test('A — associated domain is exactly applinks:qalago.kz', () {
    expect(entitlements, contains('com.apple.developer.associated-domains'));
    expect(entitlements, contains('<string>applinks:qalago.kz</string>'));
    expect(entitlements.contains('www.qalago.kz'), isFalse);
    expect(entitlements.contains('applinks:*'), isFalse);
  });

  test('B/C — no www or wildcard associated domains', () {
    expect(entitlements.contains('applinks:www.'), isFalse);
    expect(entitlements.contains('*.qalago.kz'), isFalse);
  });

  test('D — bundle ID remains kz.qalago.qalagoMobile in Xcode project', () {
    expect(
      RegExp(r'PRODUCT_BUNDLE_IDENTIFIER = kz\.qalago\.qalagoMobile;').hasMatch(pbxproj),
      isTrue,
    );
  });

  test('E — Runner target references Runner.entitlements', () {
    expect(pbxproj, contains('CODE_SIGN_ENTITLEMENTS = Runner/Runner.entitlements;'));
    expect(pbxproj, contains('Runner.entitlements'));
  });

  test('F — Flutter built-in deep linking disabled for app_links', () {
    expect(infoPlist, contains('<key>FlutterDeepLinkingEnabled</key>'));
    expect(infoPlist, contains('<false/>'));
  });

  test('G — no custom URL scheme added for Phase 5', () {
    expect(infoPlist.contains('CFBundleURLTypes'), isFalse);
  });
}
