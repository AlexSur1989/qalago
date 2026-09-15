import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/router/consumer_shell_navigation.dart';

void main() {
  group('ConsumerShellNavigation.showBottomBar', () {
    test('tab roots show bar', () {
      expect(ConsumerShellNavigation.showBottomBar('/home'), isTrue);
      expect(ConsumerShellNavigation.showBottomBar('/categories'), isTrue);
      expect(ConsumerShellNavigation.showBottomBar('/categories/food'), isTrue);
      expect(ConsumerShellNavigation.showBottomBar('/map'), isTrue);
      expect(ConsumerShellNavigation.showBottomBar('/favorites'), isTrue);
      expect(ConsumerShellNavigation.showBottomBar('/profile'), isTrue);
    });

    test('detail and task routes hide bar', () {
      expect(ConsumerShellNavigation.showBottomBar('/search'), isFalse);
      expect(ConsumerShellNavigation.showBottomBar('/business/abc'), isFalse);
      expect(ConsumerShellNavigation.showBottomBar('/business/abc/catalog'), isFalse);
      expect(ConsumerShellNavigation.showBottomBar('/profile/edit'), isFalse);
      expect(ConsumerShellNavigation.showBottomBar('/promotions'), isFalse);
      expect(ConsumerShellNavigation.showBottomBar('/notifications'), isFalse);
    });
  });

  group('ConsumerShellNavigation.selectedTabIndex', () {
    test('matches tab for visible routes', () {
      expect(ConsumerShellNavigation.selectedTabIndex('/home'), 0);
      expect(ConsumerShellNavigation.selectedTabIndex('/categories'), 1);
      expect(ConsumerShellNavigation.selectedTabIndex('/categories/x'), 1);
      expect(ConsumerShellNavigation.selectedTabIndex('/map'), 2);
      expect(ConsumerShellNavigation.selectedTabIndex('/favorites'), 3);
      expect(ConsumerShellNavigation.selectedTabIndex('/profile'), 4);
    });

    test('null when bar hidden', () {
      expect(ConsumerShellNavigation.selectedTabIndex('/search'), isNull);
      expect(ConsumerShellNavigation.selectedTabIndex('/business/1'), isNull);
      expect(ConsumerShellNavigation.selectedTabIndex('/profile/help'), isNull);
    });
  });

  group('ConsumerShellNavigation.isShellOverlayRoute', () {
    test('overlay routes', () {
      expect(ConsumerShellNavigation.isShellOverlayRoute('/search'), isTrue);
      expect(ConsumerShellNavigation.isShellOverlayRoute('/business/1'), isTrue);
      expect(ConsumerShellNavigation.isShellOverlayRoute('/profile/language'), isTrue);
      expect(ConsumerShellNavigation.isShellOverlayRoute('/home'), isFalse);
    });
  });
}
