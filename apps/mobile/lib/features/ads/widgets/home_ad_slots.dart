import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';

import '../../../core/locale/l10n_extension.dart';
import '../../../shared/models/models.dart';
import '../providers/ad_serve_provider.dart';
import 'sponsored_business_section.dart';
import 'vip_banner_ad.dart';

/// VIP banner — fails silently (no gap on error/empty).
class HomeVipBannerSlot extends ConsumerWidget {
  const HomeVipBannerSlot({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adsAsync = ref.watch(homeVipBannerAdsProvider);
    return adsAsync.when(
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        return VipBannerAd(
          key: const Key('home_section_vip'),
          item: items.first,
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class HomePromotionsAdSlot extends ConsumerWidget {
  const HomePromotionsAdSlot({
    super.key,
    required this.onPromotionTap,
  });

  final ValueChanged<PromotionModel> onPromotionTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adsAsync = ref.watch(homePromotionsAdsProvider);
    return adsAsync.when(
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        return SponsoredPromotionStrip(
          items: items,
          onTap: onPromotionTap,
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class HomeFeaturedAdSlot extends ConsumerWidget {
  const HomeFeaturedAdSlot({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adsAsync = ref.watch(homeFeaturedAdsProvider);
    return adsAsync.when(
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        return SponsoredBusinessSection(
          title: context.l10n.categorySponsored,
          items: items,
          maxVisible: 4,
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

void openAdPromotion(BuildContext context, PromotionModel promotion) {
  final business = promotion.business;
  if (business == null) return;
  openBusinessFromPromotion(context, promotion, BusinessTrafficSource.ad);
}
