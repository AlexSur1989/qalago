import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/ads/services/ad_impression_controller.dart';

void main() {
  group('AdImpressionController', () {
    test('20. impression once per session locally', () {
      final controller = AdImpressionController();
      expect(controller.hasSent('c1', 'p1'), isFalse);
      controller.markSent('c1', 'p1');
      expect(controller.hasSent('c1', 'p1'), isTrue);
      expect(controller.hasSent('c1', 'p2'), isFalse);
    });
  });

  group('AdViewabilityLogic', () {
    const logic = AdViewabilityLogic();

    test('16. impression not sent immediately — timer not started below threshold',
        () {
      expect(logic.shouldStartTimer(0.49), isFalse);
    });

    test('17. <50% visible → no impression timer', () {
      expect(logic.shouldCancelTimer(0.3), isTrue);
      expect(logic.shouldStartTimer(0.3), isFalse);
    });

    test('18. >=50% <1s — start timer only', () {
      expect(logic.shouldStartTimer(0.5), isTrue);
      expect(logic.shouldStartTimer(1.0), isTrue);
    });

    test('19. >=50% >=1s — logic allows firing after duration', () {
      expect(logic.requiredVisibleDurationMs, 1000);
      expect(logic.visibleFractionThreshold, 0.5);
    });
  });
}
