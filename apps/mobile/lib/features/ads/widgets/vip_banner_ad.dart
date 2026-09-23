import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import '../utils/ad_navigation.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/qalago_colors.dart';
import '../../../core/theme/qalago_radius.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/theme_extensions.dart';
import '../data/ad_models.dart';
import '../data/ad_placement_codes.dart';
import '../providers/ad_session_provider.dart';
import '../services/ad_tracking_service.dart';
import '../utils/ad_url_utils.dart';
import 'ad_viewability_tracker.dart';

class VipBannerAd extends ConsumerWidget {
  const VipBannerAd({
    super.key,
    required this.item,
    this.previewMode = false,
  });

  final AdItemModel item;
  final bool previewMode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final creative = item.creative;
    if (creative == null) return const SizedBox.shrink();

    final sessionId = ref.watch(adSessionIdProvider);
    final context_ = item.toContext(sessionId);
    final tracking = ref.read(adTrackingServiceProvider);
    final imageUrl = AppConstants.resolveMediaUrl(creative.imageUrl);

    final l10n = context.l10n;
    final disclosure = l10n.commonAd;

    final banner = Semantics(
      label: l10n.adSemanticLabel(creative.title),
      button: true,
      child: Material(
        color: context.cs.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(QalaGoRadius.card),
          side: BorderSide(
            color: QalaGoColors.borderSubtle.withValues(alpha: 0.6),
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: previewMode
              ? null
              : () => _handleTap(context, ref, context_, creative),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (imageUrl.isNotEmpty)
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => _placeholder(context),
                  ),
                )
              else
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: _placeholder(context),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  QalaGoSpacing.space16,
                  QalaGoSpacing.space12,
                  QalaGoSpacing.space16,
                  QalaGoSpacing.space16,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      creative.title,
                      style: context.tt.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: context.cs.onSurface,
                      ),
                    ),
                    if (creative.description != null &&
                        creative.description!.isNotEmpty) ...[
                      const SizedBox(height: QalaGoSpacing.space8),
                      Text(
                        creative.description!,
                        style: context.bodySecondaryStyle,
                      ),
                    ],
                    const SizedBox(height: QalaGoSpacing.space12),
                    Row(
                      children: [
                        Text(
                          disclosure,
                          style: context.captionStyle,
                        ),
                        const Spacer(),
                        Icon(
                          Icons.arrow_forward_rounded,
                          size: 20,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (previewMode) return banner;

    return AdViewabilityTracker(
      key: ValueKey('vip-${item.campaignId}'),
      onQualifiedImpression: () {
        unawaited(tracking.trackImpression(context_));
      },
      child: banner,
    );
  }

  void _handleTap(
    BuildContext context,
    WidgetRef ref,
    AdContext adContext,
    AdCreativeModel creative,
  ) {
    ref.read(adTrackingServiceProvider).trackEvent(
          adContext,
          AdEventTypes.click,
        );
    _navigateTarget(context, creative);
  }

  void _navigateTarget(BuildContext context, AdCreativeModel creative) {
    final adLocation = item.resolvedDestinationLocationId;
    switch (creative.targetType) {
      case 'PROMOTION':
        if (creative.targetId != null) {
          openPromotionFromAdItem(context, item);
        }
        break;
      case 'EXTERNAL_URL':
        unawaited(launchSafeHttpUrl(creative.targetUrl));
        break;
      case 'BUSINESS':
      default:
        final businessId =
            creative.targetId ?? item.business?['id'] as String?;
        if (businessId != null) {
          openBusiness(
            context,
            businessId,
            BusinessTrafficSource.ad,
            selectedLocationId: adLocation,
          );
        }
    }
  }

  Widget _placeholder(BuildContext context) {
    return ColoredBox(
      color: QalaGoColors.surfaceSubtle,
      child: Center(
        child: Icon(
          Icons.storefront_outlined,
          size: 48,
          color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
