import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/locale/app_locale_provider.dart';
import '../../../../core/locale/consumer_api_errors.dart';
import '../../../../core/locale/localized_content.dart';
import '../../../../core/locale/l10n_extension.dart';
import '../../../../core/providers/city_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/qalago_touch_targets.dart';
import '../../../../shared/models/models.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../../../shared/widgets/qalago_components.dart';
import '../../../ads/data/ad_models.dart';
import '../../../ads/providers/ad_serve_provider.dart';
import '../../../ads/widgets/home_ad_slots.dart';
import '../../../auth/providers/auth_provider.dart';

class HomePromotionsSection extends ConsumerWidget {
  const HomePromotionsSection({
    super.key,
    required this.onOrganicPromotionTap,
    required this.onPaidPromotionTap,
  });

  final ValueChanged<PromotionModel> onOrganicPromotionTap;
  final ValueChanged<AdItemModel> onPaidPromotionTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final promotionsAsync = ref.watch(promotionsProvider);
    final paidAdsAsync = ref.watch(homePromotionsAdsProvider);

    final paidHasData = paidAdsAsync.maybeWhen(
      data: (items) => items.isNotEmpty,
      orElse: () => false,
    );
    final paidLoading = paidAdsAsync.isLoading && !paidAdsAsync.hasValue;
    final organicHasData = promotionsAsync.maybeWhen(
      data: (p) => p.items.isNotEmpty,
      orElse: () => false,
    );
    final organicLoading =
        promotionsAsync.isLoading && !promotionsAsync.hasValue;

    if (!organicLoading &&
        !paidLoading &&
        !organicHasData &&
        !paidHasData) {
      return const SizedBox.shrink();
    }

    return Column(
      key: const Key('home_section_promotions'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        QalaGoSectionHeader(title: l10n.homePromotionsSection),
        Align(
          alignment: Alignment.centerRight,
          child: _ViewAllPromotionsAction(
            label: l10n.commonViewAll,
            onTap: () => context.push('/promotions'),
          ),
        ),
        const SizedBox(height: 12),
        promotionsAsync.when(
          loading: () =>
              organicLoading ? const SizedBox(height: 210, child: LoadingView()) : const SizedBox.shrink(),
          error: (e, _) {
            if (!paidHasData && !paidLoading) {
              assert(() {
                debugPrint('[QalaGo Home] promotions error: $e');
                return true;
              }());
              return ErrorView(
                message: localizedLoadError(l10n, e),
                onRetry: () => ref.invalidate(promotionsProvider),
              );
            }
            return const SizedBox.shrink();
          },
          data: (paginated) {
            final items = paginated.items.take(6).toList();
            if (items.isEmpty) return const SizedBox.shrink();
            return _OrganicPromotionsStrip(
              localeCode: resolveLocaleCode(ref.watch(appLocaleCodeProvider)),
              items: items,
              onTap: onOrganicPromotionTap,
            );
          },
        ),
        HomePromotionsAdSlot(onAdItemTap: onPaidPromotionTap),
      ],
    );
  }
}

class _ViewAllPromotionsAction extends StatelessWidget {
  const _ViewAllPromotionsAction({
    required this.label,
    required this.onTap,
  });

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: TextButton(
        onPressed: onTap,
        style: TextButton.styleFrom(
          minimumSize: const Size(
            QalaGoTouchTargets.minInteractive,
            QalaGoTouchTargets.minInteractive,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                label,
                maxLines: 2,
                overflow: TextOverflow.visible,
                softWrap: true,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
            const Icon(Icons.chevron_right, size: 22),
          ],
        ),
      ),
    );
  }
}

class _OrganicPromotionsStrip extends StatelessWidget {
  const _OrganicPromotionsStrip({
    required this.localeCode,
    required this.items,
    required this.onTap,
  });

  final String localeCode;
  final List<PromotionModel> items;
  final ValueChanged<PromotionModel> onTap;

  double _stripHeight(BuildContext context) {
    final scale = MediaQuery.textScalerOf(context).scale(1.0);
    return (210.0 * scale).clamp(210.0, 360.0);
  }

  @override
  Widget build(BuildContext context) {
    final stripHeight = _stripHeight(context);
    return SizedBox(
      height: stripHeight,
      child: ScrollConfiguration(
        behavior: ScrollConfiguration.of(context).copyWith(
          dragDevices: {
            PointerDeviceKind.touch,
            PointerDeviceKind.mouse,
            PointerDeviceKind.trackpad,
            PointerDeviceKind.stylus,
            PointerDeviceKind.unknown,
          },
        ),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(width: 12),
          itemBuilder: (context, index) => _PromotionCard(
            localeCode: localeCode,
            promotion: items[index],
            cardHeight: stripHeight,
            onTap: () => onTap(items[index]),
          ),
        ),
      ),
    );
  }
}

class _PromotionCard extends StatelessWidget {
  const _PromotionCard({
    required this.localeCode,
    required this.promotion,
    required this.cardHeight,
    required this.onTap,
  });

  final String localeCode;
  final PromotionModel promotion;
  final double cardHeight;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final displayTitle = promotionTitle(
      localeCode: localeCode,
      title: promotion.title,
      titleKk: promotion.titleKk,
    );
    final displayDescription = promotionDescription(
      localeCode: localeCode,
      description: promotion.description,
      descriptionKk: promotion.descriptionKk,
    );
    final imageUrl = AppConstants.resolveMediaUrl(
      promotion.imageUrl ?? promotion.business?.coverImageUrl,
    );

    const imageHeight = 92.0;

    return SizedBox(
      width: 210,
      height: cardHeight,
      child: Material(
        color: Colors.white,
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: promotion.business != null ? onTap : null,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: imageHeight,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (imageUrl.isNotEmpty)
                      Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) =>
                            _promoImagePlaceholder(imageHeight),
                      )
                    else
                      _promoImagePlaceholder(imageHeight),
                    if (promotion.discountText != null)
                      Positioned(
                        left: 10,
                        top: 10,
                        child: _DiscountBadge(text: promotion.discountText!),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayTitle,
                        style: const TextStyle(
                          color: AppTheme.textDark,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          height: 1.15,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        promotion.business?.title ?? 'QalaGo',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (displayDescription != null) ...[
                        const SizedBox(height: 4),
                        Expanded(
                          child: Align(
                            alignment: Alignment.topLeft,
                            child: Text(
                              displayDescription,
                              style: const TextStyle(
                                color: AppTheme.textMuted,
                                fontSize: 12,
                                height: 1.2,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DiscountBadge extends StatelessWidget {
  const _DiscountBadge({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppTheme.kzBlue,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        child: Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}

Widget _promoImagePlaceholder(double? height, {double? width}) {
  return Container(
    width: width ?? double.infinity,
    height: height,
    color: AppTheme.background,
    child: const Center(
      child: Icon(Icons.storefront, color: AppTheme.textMuted),
    ),
  );
}
