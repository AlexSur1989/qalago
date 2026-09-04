import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_utils.dart';
import 'widgets/owner_scaffold.dart';

class OwnerMessagesScreen extends ConsumerWidget {
  const OwnerMessagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return OwnerScaffold(
      title: 'Сообщения',
      actions: [
        TextButton(
          onPressed: () async {
            await ref.read(notificationsRepositoryProvider).markAllRead();
            ref.invalidate(notificationsProvider);
            ref.invalidate(unreadNotificationsProvider);
          },
          child: const Text('Прочитать все'),
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
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.screen),
                child: Text(
                  'Пока нет уведомлений. Здесь появятся отзывы, модерация и события по тарифу.',
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
              final n = items[i];
              final isRead = n['isRead'] as bool? ?? false;
              final createdAt = n['createdAt'] as String?;
              final dateLabel = createdAt != null
                  ? DateTime.tryParse(createdAt)?.toLocal().toString().split('.').first ?? ''
                  : '';
              return Card(
                color: isRead
                    ? null
                    : Theme.of(context)
                        .colorScheme
                        .primaryContainer
                        .withValues(alpha: 0.25),
                child: ListTile(
                  title: Text(n['title'] as String? ?? ''),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if ((n['body'] as String?)?.isNotEmpty ?? false)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(n['body'] as String? ?? ''),
                        ),
                      const SizedBox(height: 6),
                      Text(
                        ownerNotificationTypeLabel(n['type'] as String? ?? ''),
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                      if (dateLabel.isNotEmpty)
                        Text(
                          dateLabel,
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: Colors.grey,
                              ),
                        ),
                    ],
                  ),
                  onTap: () async {
                    final id = n['id'] as String?;
                    if (id != null && !isRead) {
                      await ref.read(notificationsRepositoryProvider).markRead(id);
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
