import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/locale/l10n_extension.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../providers/notifications_inbox_provider.dart';
import 'notification_list_tile.dart';

class NotificationsInboxBody extends ConsumerStatefulWidget {
  const NotificationsInboxBody({
    super.key,
    required this.emptyMessage,
  });

  final String emptyMessage;

  @override
  ConsumerState<NotificationsInboxBody> createState() =>
      _NotificationsInboxBodyState();
}

class _NotificationsInboxBodyState extends ConsumerState<NotificationsInboxBody> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 200) {
      ref.read(notificationsInboxProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final state = ref.watch(notificationsInboxProvider);
    final notifier = ref.read(notificationsInboxProvider.notifier);

    if (state.initialLoading && state.items.isEmpty) {
      return const LoadingView();
    }

    if (state.initialError != null && state.items.isEmpty) {
      return ErrorView(
        message: l10n.commonSomethingWrong,
        onRetry: () => notifier.loadInitial(),
      );
    }

    if (state.isEmptyLoaded) {
      return RefreshIndicator(
        onRefresh: notifier.refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: MediaQuery.sizeOf(context).height * 0.4,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.screen),
                  child: Text(widget.emptyMessage, textAlign: TextAlign.center),
                ),
              ),
            ),
          ],
        ),
      );
    }

    final endReached =
        state.items.isNotEmpty && !state.hasMore && state.loadMoreError == null;
    final footerSlots =
        state.loadingMore || state.loadMoreError != null || endReached ? 1 : 0;

    return RefreshIndicator(
      onRefresh: notifier.refresh,
      child: ListView.builder(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.screen),
        itemCount: state.items.length + footerSlots,
        itemBuilder: (context, index) {
          if (index < state.items.length) {
            final n = state.items[index];
            return Padding(
              padding: EdgeInsets.only(
                bottom: index == state.items.length - 1 && footerSlots == 0
                    ? 0
                    : AppSpacing.item,
              ),
              child: NotificationListTile(
                notification: n,
                l10n: l10n,
                onTap: () => notifier.markRead(n.id),
              ),
            );
          }

          if (state.loadMoreError != null) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.item),
              child: Column(
                children: [
                  Text(
                    l10n.notificationsLoadMoreFailed,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  TextButton(
                    onPressed: notifier.loadMore,
                    child: Text(l10n.commonRetry),
                  ),
                ],
              ),
            );
          }

          if (state.loadingMore) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.item),
              child: Center(
                child: Text(
                  l10n.notificationsLoadingMore,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            );
          }

          return Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.item),
            child: Center(
              child: Text(
                l10n.notificationsEndOfList,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          );
        },
      ),
    );
  }
}
