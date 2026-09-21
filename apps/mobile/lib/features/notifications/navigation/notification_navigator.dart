import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/locale/l10n_extension.dart';
import '../../owner/providers/owner_providers.dart';
import '../data/notification_model.dart';
import '../providers/notifications_inbox_provider.dart';
import 'notification_destination.dart';

/// Navigates to [destination] using existing canonical routes (push, preserves back stack).
Future<void> navigateNotificationDestination(
  WidgetRef ref,
  BuildContext context,
  NotificationDestination destination,
) async {
  if (notificationDestinationIsEmpty(destination)) return;

  switch (destination) {
    case NoNotificationDestination():
      return;
    case ConsumerBusinessDetailsDestination(:final businessId):
      context.push('/business/$businessId');
    case ConsumerBusinessReviewsDestination(:final businessId):
      context.push('/business/$businessId/reviews');
    case ConsumerProfileReviewsDestination():
      context.push('/profile/reviews');
    case ConsumerPromotionsDestination():
      context.push('/promotions');
    case OwnerReviewsDestination(:final businessId):
      onOwnerBusinessSelected(ref, businessId);
      context.push('/owner/reviews/$businessId');
    case OwnerPlanDestination(:final businessId):
      onOwnerBusinessSelected(ref, businessId);
      context.push('/owner/plan');
    case OwnerTeamDestination(:final businessId):
      onOwnerBusinessSelected(ref, businessId);
      context.push('/owner/team');
    case OwnerMonetizationCampaignDestination(:final campaignId):
      context.push('/owner/monetization/campaigns/$campaignId');
    case BusinessApplicationFlowDestination(:final applicationId):
      context.push(
        Uri(
          path: '/business/apply',
          queryParameters: {'id': applicationId},
        ).toString(),
      );
    case BusinessClaimsListDestination():
      context.push('/business/claims');
  }
}

Future<void> handleNotificationTap(
  WidgetRef ref,
  BuildContext context,
  AppNotification notification, {
  required bool navigationLocked,
  required void Function(String notificationId) onNavigationStarted,
}) async {
  if (navigationLocked) return;

  final destination = resolveNotificationDestination(notification);
  final hasDestination = !notificationDestinationIsEmpty(destination);

  if (hasDestination) {
    onNavigationStarted(notification.id);
  }

  final notifier = ref.read(notificationsInboxProvider.notifier);
  if (!notification.isRead) {
    await notifier.markRead(notification.id);
  }

  if (!hasDestination || !context.mounted) return;

  try {
    await navigateNotificationDestination(ref, context, destination);
  } catch (_) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(context.l10n.notificationEntityUnavailable)),
    );
  }
}
