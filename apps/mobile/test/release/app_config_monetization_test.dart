import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/release/app_config_models.dart';
import 'package:qalago_mobile/core/release/semver.dart';

void main() {
  group('AppConfig monetization (6.18L.1)', () {
    test('missing purchase flags default to disabled', () {
      final config = AppConfigSnapshot.fromJson(
        {'configRevision': 1},
        ClientUpdateMode.none,
      );
      expect(config.canPurchasePlans, isFalse);
      expect(config.canPurchaseAds, isFalse);
      expect(config.launchAccessActive, isFalse);
    });

    test('parses launch mode fields from app-config', () {
      final config = AppConfigSnapshot.fromJson(
        {
          'configRevision': 2,
          'monetizationMode': 'LAUNCH',
          'canPurchasePlans': false,
          'canPurchaseAds': false,
          'launchAccessActive': true,
        },
        ClientUpdateMode.none,
      );
      expect(config.monetizationMode, 'LAUNCH');
      expect(config.launchAccessActive, isTrue);
    });
  });
}
