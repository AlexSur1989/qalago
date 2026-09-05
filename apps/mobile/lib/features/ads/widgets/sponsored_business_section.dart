import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/business_card.dart';
import '../data/ad_models.dart';
import '../data/ad_placement_codes.dart';
import '../providers/ad_session_provider.dart';
import '../services/ad_tracking_service.dart';
import 'ad_viewability_tracker.dart';
import 'sponsored_label.dart';

class SponsoredBusinessSection extends ConsumerWidget {
  const SponsoredBusinessSection({
    super.key,
    required this.title,
    required this.items,
  });

  final String title;
  final List<AdItemModel> items;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (items.isEmpty) return const SizedBox.shrink();

    final sessionId = ref.watch(adSessionIdProvider);
    final tracking = ref.read(adTrackingServiceProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                ),
              ),
            ),
            SponsoredLabel(label: items.first.displayLabel),
          ],
        ),
        const SizedBox(height: 12),
        for (final item in items) ...[
          _SponsoredBusinessTile(
            item: item,
            adContext: item.toContext(sessionId),
            tracking: tracking,
            onTap: () {
              final business = item.toBusinessModel();
              if (business == null) return;
              tracking.trackEvent(
                item.toContext(sessionId),
                AdEventTypes.cardOpen,
              );
              context.push('/business/${business.id}');
            },
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _SponsoredBusinessTile extends StatelessWidget {
  const _SponsoredBusinessTile({
    required this.item,
    required this.adContext,
    required this.tracking,
    required this.onTap,
  });

  final AdItemModel item;
  final AdContext adContext;
  final AdTrackingService tracking;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final business = item.toBusinessModel();
    if (business == null) return const SizedBox.shrink();

    return AdViewabilityTracker(
      key: ValueKey('biz-ad-${item.campaignId}-${item.position}'),
      onQualifiedImpression: () {
        unawaited(tracking.trackImpression(adContext));
      },
      child: BusinessCard(
        business: business,
        sponsored: true,
        sponsoredLabel: item.displayLabel,
        onTap: onTap,
      ),
    );
  }
}

class SponsoredPromotionStrip extends ConsumerWidget {
  const SponsoredPromotionStrip({
    super.key,
    required this.items,
    required this.onTap,
  });

  final List<AdItemModel> items;
  final ValueChanged<PromotionModel> onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (items.isEmpty) return const SizedBox.shrink();

    final sessionId = ref.watch(adSessionIdProvider);
    final tracking = ref.read(adTrackingServiceProvider);
    final entries = <({AdItemModel item, PromotionModel promotion})>[];
    for (final item in items) {
      final promotion = item.toPromotionModel();
      if (promotion != null) {
        entries.add((item: item, promotion: promotion));
      }
    }

    if (entries.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'Продвигается',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                ),
              ),
            ),
            SponsoredLabel(label: items.first.displayLabel),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 210,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: entries.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final entry = entries[index];
              final item = entry.item;
              final promotion = entry.promotion;
              return AdViewabilityTracker(
                key: ValueKey('promo-ad-${item.campaignId}'),
                onQualifiedImpression: () {
                  unawaited(
                    tracking.trackImpression(item.toContext(sessionId)),
                  );
                },
                child: _SponsoredPromotionCard(
                  promotion: promotion,
                  displayLabel: item.displayLabel,
                  onTap: () {
                    tracking.trackEvent(
                      item.toContext(sessionId),
                      AdEventTypes.promotionOpen,
                    );
                    onTap(promotion);
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _SponsoredPromotionCard extends StatelessWidget {
  const _SponsoredPromotionCard({
    required this.promotion,
    required this.displayLabel,
    required this.onTap,
  });

  final PromotionModel promotion;
  final String displayLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final imageUrl = AppConstants.resolveMediaUrl(
      promotion.imageUrl ?? promotion.business?.coverImageUrl,
    );

    return SizedBox(
      width: 210,
      child: Material(
        color: Colors.white,
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
                child: Stack(
                  children: [
                    if (imageUrl.isNotEmpty)
                      Image.network(
                        imageUrl,
                        width: double.infinity,
                        height: 100,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _placeholder(),
                      )
                    else
                      _placeholder(),
                    Positioned(
                      left: 8,
                      top: 8,
                      child: SponsoredLabel(label: displayLabel),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      promotion.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      promotion.business?.title ?? 'QalaGo',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF6F7683),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      height: 100,
      width: double.infinity,
      color: const Color(0xFFF0F2F5),
      child: const Icon(Icons.local_offer_outlined),
    );
  }
}
