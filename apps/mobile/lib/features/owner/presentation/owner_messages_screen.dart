import 'package:flutter/material.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/data/notification_model.dart';
import '../utils/owner_l10n.dart';
import 'widgets/owner_scaffold.dart';
import '../../../core/theme/app_theme.dart';

class OwnerMessagesScreen extends ConsumerWidget {
  const OwnerMessagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return OwnerScaffold(
      title: context.l10n.ownerNavMessages,
      actions: [
        TextButton(
          onPressed: () async {
            await ref.read(notificationsRepositoryProvider).markAllRead();
            ref.invalidate(notificationsProvider);
            ref.invalidate(unreadNotificationsProvider);
          },
          child: Text(context.l10n.notificationsMarkAllRead),
        ),
      ],
      body: notificationsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(notificationsProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.screen),
                child: Text(
                  context.l10n.notificationsOwnerEmptyBody,
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.screen),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.item),
            itemBuilder: (context, i) {
              final AppNotification n = items[i];
              final dateLabel = n.createdAt?.toLocal().toString().split('.').first ?? '';
              return Card(
                color: n.isRead
                    ? null
                    : Theme.of(context)
                        .colorScheme
                        .primaryContainer
                        .withValues(alpha: 0.25),
                child: ListTile(
                  title: Text(n.title),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (n.body?.isNotEmpty ?? false)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(n.body ?? ''),
                        ),
                      const SizedBox(height: 6),
                      Text(
                        ownerNotificationTypeLabel(context.l10n, n.type),
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                      if (dateLabel.isNotEmpty)
                        Text(
                          dateLabel,
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: AppTheme.textMuted,
                              ),
                        ),
                    ],
                  ),
                  onTap: () async {
                    if (n.id.isNotEmpty && !n.isRead) {
                      await ref.read(notificationsRepositoryProvider).markRead(n.id);
                      ref.invalidate(notificationsProvider);
                      ref.invalidate(unreadNotificationsProvider);
                    }
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
