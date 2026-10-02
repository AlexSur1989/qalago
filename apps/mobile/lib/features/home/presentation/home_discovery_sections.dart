import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../ads/widgets/home_ad_slots.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../shared/models/models.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import '../data/home_section_type.dart';
import 'home_layout.dart';
import 'sections/home_categories_section.dart';
import 'sections/home_nearby_section.dart';
import 'sections/home_popular_section.dart';
import 'sections/home_promoted_section.dart';
import 'sections/home_promotions_section.dart';

/// Config-driven discovery blocks (order from [sections]).
class HomeDiscoverySections extends ConsumerWidget {
  const HomeDiscoverySections({
    super.key,
    required this.sections,
    required this.localeCode,
    required this.onCategorySelected,
  });

  final List<HomeSectionType> sections;
  final String localeCode;
  final void Function(CategoryModel category) onCategorySelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final children = <Widget>[];
    for (var i = 0; i < sections.length; i++) {
      if (i > 0) {
        children.add(const SizedBox(height: HomeLayout.sectionGap));
      }
      children.add(
        _HomeDiscoverySectionSlot(
          key: ValueKey(sections[i]),
          type: sections[i],
          localeCode: localeCode,
          onCategorySelected: onCategorySelected,
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: children,
    );
  }
}

class _HomeDiscoverySectionSlot extends ConsumerWidget {
  const _HomeDiscoverySectionSlot({
    super.key,
    required this.type,
    required this.localeCode,
    required this.onCategorySelected,
  });

  final HomeSectionType type;
  final String localeCode;
  final void Function(CategoryModel category) onCategorySelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    switch (type) {
      case HomeSectionType.categories:
        return HomeCategoriesSection(
          localeCode: localeCode,
          onCategorySelected: onCategorySelected,
        );
      case HomeSectionType.homeVipBanner:
        return const HomeVipBannerSlot();
      case HomeSectionType.nearby:
        return const HomeNearbySection();
      case HomeSectionType.homeFeatured:
        return const HomePromotedSection();
      case HomeSectionType.homePromotions:
        return HomePromotionsSection(
          onOrganicPromotionTap: (promotion) {
            final business = promotion.business;
            if (business == null) return;
            unawaited(
              ref.read(catalogRepositoryProvider).trackPromotionView(
                    business.id,
                    promotionId: promotion.id,
                  ),
            );
            openBusinessFromPromotion(
              context,
              promotion,
              BusinessTrafficSource.promotions,
            );
          },
          onPaidPromotionTap: (item) {
            openAdPromotion(context, item);
          },
        );
      case HomeSectionType.homePopular:
        return const HomePopularSection();
    }
  }
}
