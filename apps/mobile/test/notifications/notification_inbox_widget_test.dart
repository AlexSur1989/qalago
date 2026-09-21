import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qalago_mobile/features/auth/providers/auth_provider.dart';
import 'package:qalago_mobile/features/notifications/data/notification_model.dart';
import 'package:qalago_mobile/features/notifications/presentation/widgets/notification_list_tile.dart';
import 'package:qalago_mobile/features/notifications/providers/notifications_inbox_provider.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

void main() {
  testWidgets('unread notification shows bold title and dot', (tester) async {
    const n = AppNotification(
      id: '1',
      type: 'NEW_REVIEW',
      title: 'Backend RU title',
      body: 'ignored',
      isRead: false,
      createdAt: null,
    );
    final l10n = AppLocalizationsRu();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: NotificationListTile(notification: n, l10n: l10n, onTap: () {}),
        ),
      ),
    );
    expect(find.text(l10n.notificationNewReviewTitle), findsOneWidget);
    expect(find.text('Backend RU title'), findsNothing);
    expect(find.byIcon(Icons.circle), findsOneWidget);
  });

  testWidgets('empty inbox shows localized empty message', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          notificationsInboxProvider.overrideWith(() => _EmptyInboxNotifier()),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return Consumer(
                  builder: (context, ref, _) {
                    final state = ref.watch(notificationsInboxProvider);
                    if (state.isEmptyLoaded) {
                      return Text(AppLocalizationsRu().notificationsEmpty);
                    }
                    return const SizedBox.shrink();
                  },
                );
              },
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text(AppLocalizationsRu().notificationsEmpty), findsOneWidget);
  });
}

class _EmptyInboxNotifier extends NotificationsInboxNotifier {
  @override
  NotificationsInboxState build() {
    return const NotificationsInboxState(initialLoading: false);
  }
}
