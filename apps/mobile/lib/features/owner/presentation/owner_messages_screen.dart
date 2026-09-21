import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';

import '../../notifications/providers/notifications_inbox_provider.dart';
import '../../notifications/presentation/widgets/notifications_inbox_body.dart';
import 'widgets/owner_scaffold.dart';

class OwnerMessagesScreen extends ConsumerWidget {
  const OwnerMessagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final notifier = ref.read(notificationsInboxProvider.notifier);

    return OwnerScaffold(
      title: l10n.ownerNavMessages,
      actions: [
        TextButton(
          onPressed: () => notifier.markAllRead(),
          child: Text(l10n.notificationsMarkAllRead),
        ),
      ],
      body: NotificationsInboxBody(emptyMessage: l10n.notificationsOwnerEmptyBody),
    );
  }
}
