import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/push/push_message_mapper.dart';
import 'package:qalago_mobile/features/notifications/navigation/notification_destination.dart';

void main() {
  group('appNotificationFromPushData', () {
    test('parses whitelisted review payload', () {
      final notification = appNotificationFromPushData({
        'notificationId': 'n1',
        'type': 'NEW_REVIEW',
        'targetType': 'REVIEW',
        'targetId': 'rev-1',
        'businessId': 'b1',
      });
      expect(notification, isNotNull);
      expect(notification!.id, 'n1');
      final destination = resolveNotificationDestination(notification);
      expect(destination, isA<OwnerReviewsDestination>());
    });

    test('malformed push returns null', () {
      expect(appNotificationFromPushData({'type': 'X'}), isNull);
      expect(appNotificationFromPushData({'route': '/admin'}), isNull);
    });

    test('unsafe route keys are flagged', () {
      expect(
        pushDataContainsUnsafeRoute({'url': 'https://evil.example'}),
        isTrue,
      );
    });

    test('unknown target does not include arbitrary route execution', () {
      final notification = appNotificationFromPushData({
        'notificationId': 'n2',
        'type': 'GENERAL',
        'targetType': 'UNKNOWN',
        'targetId': 'x',
      });
      expect(notification, isNotNull);
      final destination = resolveNotificationDestination(notification!);
      expect(notificationDestinationIsEmpty(destination), isTrue);
    });
  });
}
