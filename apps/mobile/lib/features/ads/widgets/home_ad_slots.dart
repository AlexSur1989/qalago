import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/ad_models.dart';
import '../utils/ad_navigation.dart';

import '../../../core/locale/l10n_extension.dart';
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
    required this.onAdItemTap,
  });

  final ValueChanged<AdItemModel> onAdItemTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final adsAsync = ref.watch(homePromotionsAdsProvider);
    return adsAsync.when(
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        return SponsoredPromotionStrip(
          items: items,
          onItemTap: onAdItemTap,
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

void openAdPromotion(BuildContext context, AdItemModel item) {
  openPromotionFromAdItem(context, item);
}
