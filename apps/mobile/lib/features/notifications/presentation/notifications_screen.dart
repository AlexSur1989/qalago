import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../auth/providers/auth_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notificationsTitle),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(notificationsRepositoryProvider).markAllRead();
              ref.invalidate(notificationsProvider);
              ref.invalidate(unreadNotificationsProvider);
            },
            child: Text(l10n.notificationsMarkAllRead),
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(notificationsProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return Center(child: Text(l10n.notificationsEmpty));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.screen),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.item),
            itemBuilder: (context, i) {
              final n = items[i];
              final isRead = n['isRead'] as bool? ?? false;
              return Card(
                color: isRead ? null : Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.3),
                child: ListTile(
                  title: Text(n['title'] as String? ?? ''),
                  subtitle: Text(n['body'] as String? ?? ''),
                  trailing: Text(
                    (n['type'] as String? ?? '').replaceAll('_', ' '),
                    style: Theme.of(context).textTheme.labelSmall,
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
