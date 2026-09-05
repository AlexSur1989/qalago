import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../data/ad_models.dart';
import '../data/ad_placement_codes.dart';
import '../providers/ad_session_provider.dart';
import '../services/ad_tracking_service.dart';
import '../utils/ad_url_utils.dart';
import 'ad_viewability_tracker.dart';
import 'sponsored_label.dart';

class VipBannerAd extends ConsumerWidget {
  const VipBannerAd({super.key, required this.item});

  final AdItemModel item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final creative = item.creative;
    if (creative == null) return const SizedBox.shrink();

    final sessionId = ref.watch(adSessionIdProvider);
    final context_ = item.toContext(sessionId);
    final tracking = ref.read(adTrackingServiceProvider);
    final imageUrl = AppConstants.resolveMediaUrl(creative.imageUrl);

    return AdViewabilityTracker(
      key: ValueKey('vip-${item.campaignId}'),
      onQualifiedImpression: () {
        unawaited(tracking.trackImpression(context_));
      },
      child: Semantics(
        label: 'Реклама: ${creative.title}',
        button: true,
        child: Material(
          color: Colors.white,
          elevation: 2,
          shadowColor: Colors.black.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => _handleTap(context, ref, context_, creative),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (imageUrl.isNotEmpty)
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    child: Image.network(
                      imageUrl,
                      width: double.infinity,
                      height: 160,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => _placeholder(),
                    ),
                  )
                else
                  _placeholder(),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          SponsoredLabel(label: item.displayLabel),
                          const Spacer(),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        creative.title,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: Colors.black,
                        ),
                      ),
                      if (creative.description != null &&
                          creative.description!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          creative.description!,
                          style: TextStyle(
                            color: Colors.black.withValues(alpha: 0.65),
                            fontSize: 14,
                            height: 1.3,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 14),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: FilledButton(
                          onPressed: () =>
                              _handleTap(context, ref, context_, creative),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.kzBlue,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text(
                            creative.buttonText ?? 'Подробнее',
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
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
    switch (creative.targetType) {
      case 'PROMOTION':
        if (creative.targetId != null) {
          context.push('/business/${item.business?['id']}');
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
          context.push('/business/$businessId');
        }
    }
  }

  Widget _placeholder() {
    return Container(
      height: 160,
      width: double.infinity,
      color: const Color(0xFFF0F2F5),
      child: const Icon(Icons.campaign_outlined, size: 48),
    );
  }
}
