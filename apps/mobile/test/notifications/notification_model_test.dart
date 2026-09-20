import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/notifications/data/notification_model.dart';
import 'package:qalago_mobile/features/owner/utils/owner_l10n.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

void main() {
  test('parses paginated notifications response', () {
    final page = PaginatedNotifications.fromJson({
      'items': [
        {
          'id': 'n1',
          'type': 'NEW_REVIEW',
          'title': 'Новый отзыв',
          'body': 'body',
          'isRead': false,
          'createdAt': '2026-09-20T12:00:00.000Z',
          'targetType': 'REVIEW',
          'targetId': 'rev-1',
          'payload': {'businessId': 'b1', 'reviewId': 'rev-1'},
        },
      ],
      'pagination': {'page': 1, 'limit': 20, 'total': 1, 'totalPages': 1},
    });

    expect(page.items, hasLength(1));
    expect(page.items.first.type, 'NEW_REVIEW');
    expect(page.items.first.targetId, 'rev-1');
  });

  test('maps canonical NEW_REVIEW type label', () {
    final l10n = AppLocalizationsRu();
    expect(
      ownerNotificationTypeLabel(l10n, 'NEW_REVIEW'),
      l10n.ownerNotificationReviewNew,
    );
  });
}
