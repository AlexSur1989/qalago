import 'package:flutter/material.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../l10n/app_localizations.dart';
import '../../data/notification_model.dart';
import '../../utils/notification_date_format.dart';
import '../notification_presentation.dart';

class NotificationListTile extends StatelessWidget {
  const NotificationListTile({
    super.key,
    required this.notification,
    required this.l10n,
    required this.onTap,
  });

  final AppNotification notification;
  final AppLocalizations l10n;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final presentation = presentAppNotification(l10n, notification);
    final dateLabel = formatNotificationDateTime(l10n, notification.createdAt);
    final unread = !notification.isRead;

    return Semantics(
      label: presentation.title,
      selected: unread,
      child: Card(
        color: unread ? scheme.primaryContainer.withValues(alpha: 0.28) : null,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.item),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  notificationCategoryIcon(presentation.category),
                  color: unread ? scheme.primary : AppTheme.textMuted,
                ),
                const SizedBox(width: AppSpacing.item),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              presentation.title,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: unread
                                    ? FontWeight.w600
                                    : FontWeight.w500,
                              ),
                            ),
                          ),
                          if (unread)
                            Padding(
                              padding: const EdgeInsets.only(left: 8, top: 4),
                              child: Icon(
                                Icons.circle,
                                size: 8,
                                color: scheme.primary,
                                semanticLabel: l10n.notificationsTitle,
                              ),
                            ),
                        ],
                      ),
                      if (presentation.body != null &&
                          presentation.body!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          presentation.body!,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                      if (dateLabel.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          dateLabel,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
