import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/locale/l10n_extension.dart';
import '../providers/notifications_inbox_provider.dart';
import 'widgets/notifications_inbox_body.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final notifier = ref.read(notificationsInboxProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notificationsTitle),
        actions: [
          TextButton(
            onPressed: () => notifier.markAllRead(),
            child: Text(l10n.notificationsMarkAllRead),
          ),
        ],
      ),
      body: NotificationsInboxBody(emptyMessage: l10n.notificationsEmpty),
    );
  }
}
