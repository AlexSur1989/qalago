import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/location/user_location_provider.dart';
import '../../../core/providers/city_catalog_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/utils/business_rank.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../../shared/widgets/empty_city_view.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../../categories/presentation/category_businesses_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  Timer? _featuredTimer;
  int _featuredIndex = 0;
  int _featuredItemsCount = 0;

  @override
  void dispose() {
    _featuredTimer?.cancel();
    super.dispose();
  }

  BusinessesQuery _businessesQuery(UserPosition userPosition) => BusinessesQuery(
        latitude: userPosition.latitude,
        longitude: userPosition.longitude,
        radiusKm: nearbyRadiusKm,
      );

  void _syncFeaturedItemsCount(int count) {
    final changed = count != _featuredItemsCount;
    _featuredItemsCount = count;
    if (count == 0 || _featuredIndex >= count) {
      _featuredIndex = 0;
    }
    if (!changed) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _restartFeaturedTimer();
    });
  }

  void _restartFeaturedTimer() {
    _featuredTimer?.cancel();
    if (_featuredItemsCount <= 1) return;
    _featuredTimer = Timer(const Duration(seconds: 3), () {
      if (!mounted || _featuredItemsCount <= 1) return;
      setState(() {
        _featuredIndex = (_featuredIndex + 1) % _featuredItemsCount;
      });
      _restartFeaturedTimer();
    });
  }

  void _showPreviousFeatured() {
    if (_featuredItemsCount <= 1) return;
    setState(() {
      _featuredIndex =
          (_featuredIndex - 1 + _featuredItemsCount) % _featuredItemsCount;
    });
    _restartFeaturedTimer();
  }

  void _showNextFeatured() {
    if (_featuredItemsCount <= 1) return;
    setState(() {
      _featuredIndex = (_featuredIndex + 1) % _featuredItemsCount;
    });
    _restartFeaturedTimer();
  }

  void _openCategory(CategoryModel category) {
    openCategory(context, category);
  }

  Future<void> _showCityPicker() async {
    await showCityPickerSheet(context, ref);
  }

  void _openPromotion(PromotionModel promotion) {
    final business = promotion.business;
    if (business == null) return;
    unawaited(
      ref.read(catalogRepositoryProvider).trackPromotionView(business.id),
    );
    context.push('/business/${business.id}');
  }

  @override
  Widget build(BuildContext context) {
    final city = ref.watch(cityProvider);
    final nearbyPosition = ref.watch(nearbySearchPositionProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final businessesAsync = ref.watch(
      businessesProvider(_businessesQuery(nearbyPosition)),
    );
    final featuredAsync = ref.watch(recommendedBusinessesProvider);
    final promotionsAsync = ref.watch(promotionsProvider);
    final unreadAsync = ref.watch(unreadNotificationsProvider);
    final catalogTotalAsync = ref.watch(cityCatalogTotalProvider);
    final isEmptyCity =
        catalogTotalAsync.hasValue && catalogTotalAsync.value == 0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.kzBlue,
          onRefresh: () async {
            ref.invalidate(categoriesProvider);
            ref.invalidate(cityCatalogTotalProvider);
            ref.invalidate(businessesProvider);
            ref.invalidate(recommendedBusinessesProvider);
            ref.invalidate(promotionsProvider);
            ref.invalidate(unreadNotificationsProvider);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _HomeHeader(
                        cityName: city.nameRu,
                        unreadAsync: unreadAsync,
                        onCityTap: _showCityPicker,
                        onNotificationsTap: () =>
                            context.push('/notifications'),
                      ),
                      const SizedBox(height: 20),
                      _SearchBox(
                        onTap: () => context.push('/search'),
                      ),
                      const SizedBox(height: 20),
                      if (catalogTotalAsync.isLoading && !catalogTotalAsync.hasValue)
                        const SizedBox(height: 280, child: LoadingView())
                      else if (isEmptyCity)
                        EmptyCityView(
                          cityName: city.nameRu,
                          isComingSoon: city.isComingSoon,
                          onPickCity: _showCityPicker,
                        )
                      else ...[
                      categoriesAsync.when(
                        loading: () =>
                            const SizedBox(height: 130, child: LoadingView()),
                        error: (e, _) => ErrorView(
                          message: '$e',
                          onRetry: () => ref.invalidate(categoriesProvider),
                        ),
                        data: (categories) => _CategoryPhotoStrip(
                          categories: categories,
                          onSelected: _openCategory,
                        ),
                      ),
                      const SizedBox(height: 24),
                      _SectionHeader(
                        title: 'Акции и предложения',
                        onAction: () => context.push('/promotions'),
                      ),
                      const SizedBox(height: 12),
                      promotionsAsync.when(
                        loading: () =>
                            const SizedBox(height: 210, child: LoadingView()),
                        error: (e, _) => Text(
                          'Акции: $e',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                        data: (paginated) => _PromotionsStrip(
                          items: paginated.items.take(6).toList(),
                          onTap: _openPromotion,
                        ),
                      ),
                      const SizedBox(height: 24),
                      _SectionHeader(
                        title: 'Рекомендуем',
                        actionLabel: _featuredItemsCount > 1
                            ? '${_featuredIndex + 1} / $_featuredItemsCount'
                            : null,
                      ),
                      const SizedBox(height: 12),
                      featuredAsync.when(
                        loading: () =>
                            const SizedBox(height: 194, child: LoadingView()),
                        error: (e, _) => ErrorView(
                          message: '$e',
                          onRetry: () =>
                              ref.invalidate(recommendedBusinessesProvider),
                        ),
                        data: (items) {
                          _syncFeaturedItemsCount(items.length);
                          return _PopularPlacesCarousel(
                            items: items,
                            index: _featuredIndex,
                            onPrevious: _showPreviousFeatured,
                            onNext: _showNextFeatured,
                          );
                        },
                      ),
                      const SizedBox(height: 24),
                      const _SectionHeader(
                        title: 'Рядом с вами',
                        subtitle: 'До 3 км · сначала TOP и VIP',
                      ),
                      const SizedBox(height: 12),
                      businessesAsync.when(
                        loading: () => const LoadingView(),
                        error: (e, _) => ErrorView(
                          message: 'API недоступен.\n$e',
                          onRetry: () => ref.invalidate(businessesProvider),
                        ),
                        data: (data) => _NearbyBusinessList(items: data.items),
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

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({
    required this.cityName,
    required this.unreadAsync,
    required this.onCityTap,
    required this.onNotificationsTap,
  });

  final String cityName;
  final AsyncValue<int> unreadAsync;
  final VoidCallback onCityTap;
  final VoidCallback onNotificationsTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: const QalaGoLogo(fontSize: 38, fit: true),
        ),
        const SizedBox(width: 12),
        CityPill(cityName: cityName, onTap: onCityTap),
        const SizedBox(width: 10),
        unreadAsync.when(
          data: (count) =>
              _NotificationIcon(count: count, onTap: onNotificationsTap),
          loading: () => _NotificationIcon(count: 0, onTap: onNotificationsTap),
          error: (_, _) =>
              _NotificationIcon(count: 0, onTap: onNotificationsTap),
        ),
      ],
    );
  }
}

class _NotificationIcon extends StatelessWidget {
  const _NotificationIcon({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Уведомления',
      onPressed: onTap,
      icon: Badge(
        isLabelVisible: count > 0,
        label: Text('$count'),
        backgroundColor: AppTheme.kzGold,
        textColor: Colors.black,
        child: const Icon(
          Icons.notifications_none_rounded,
          size: 31,
          color: Colors.black,
        ),
      ),
    );
  }
}

class _SearchBox extends StatelessWidget {
  const _SearchBox({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AbsorbPointer(
        child: TextField(
          readOnly: true,
          decoration: InputDecoration(
            hintText: 'Поиск заведений и услуг...',
            prefixIcon: const Icon(Icons.search, color: Color(0xFF8A919F)),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 18),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.08)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppTheme.kzBlue, width: 1.4),
            ),
          ),
        ),
      ),
    );
  }
}

class _CategoryPhotoStrip extends StatelessWidget {
  const _CategoryPhotoStrip({
    required this.categories,
    required this.onSelected,
  });

  final List<CategoryModel> categories;
  final ValueChanged<CategoryModel> onSelected;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) {
      return const SizedBox(
        height: 130,
        child: Center(child: Text('Категории пока не добавлены')),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final columns = width >= 900
            ? 5
            : width >= 720
                ? 4
                : width >= 520
                    ? 3
                    : 2;
        const spacing = 8.0;
        final itemWidth = (width - spacing * (columns - 1)) / columns;
        final itemHeight = (itemWidth * 0.88).clamp(92.0, 118.0);

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            for (final category in categories)
              SizedBox(
                width: itemWidth,
                height: itemHeight,
                child: _CategoryPhotoCard(
                  category: category,
                  onTap: () => onSelected(category),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _CategoryPhotoCard extends StatelessWidget {
  const _CategoryPhotoCard({
    required this.category,
    required this.onTap,
  });

  final CategoryModel category;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final imageUrl = AppConstants.resolveMediaUrl(category.icon);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: const Color(0xFFF0F2F5),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (imageUrl.isNotEmpty)
                Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => const SizedBox.shrink(),
                )
              else
                const Center(child: Icon(Icons.category_outlined, size: 34)),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withValues(alpha: 0.72),
                      Colors.black.withValues(alpha: 0.05),
                    ],
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                  ),
                ),
              ),
              Positioned(
                left: 9,
                right: 9,
                bottom: 10,
                child: Text(
                  category.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    height: 1.1,
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

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    this.subtitle,
    this.actionLabel = 'Смотреть все',
    this.onAction,
  });

  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Text(
                title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.black,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
              ),
            ),
            if (actionLabel != null)
              if (onAction != null)
                TextButton.icon(
                  onPressed: onAction,
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.kzBlue,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  iconAlignment: IconAlignment.end,
                  label: Text(
                    actionLabel!,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  icon: const Icon(Icons.chevron_right, size: 22),
                )
              else
                Text(
                  actionLabel!,
                  style: const TextStyle(
                    color: AppTheme.kzBlue,
                    fontWeight: FontWeight.w800,
                  ),
                ),
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: TextStyle(color: Colors.black.withValues(alpha: 0.55)),
          ),
        ],
      ],
    );
  }
}

class _PromotionsStrip extends StatelessWidget {
  const _PromotionsStrip({required this.items, required this.onTap});

  final List<PromotionModel> items;
  final ValueChanged<PromotionModel> onTap;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const SizedBox(
        height: 96,
        child: Center(child: Text('Нет активных акций')),
      );
    }

    return SizedBox(
      height: 210,
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
          physics: const BouncingScrollPhysics(),
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(width: 12),
          itemBuilder: (context, index) => _PromotionCard(
            promotion: items[index],
            onTap: () => onTap(items[index]),
          ),
        ),
      ),
    );
  }
}

class _PromotionCard extends StatelessWidget {
  const _PromotionCard({required this.promotion, required this.onTap});

  final PromotionModel promotion;
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
          onTap: promotion.business != null ? onTap : null,
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
                        errorBuilder: (_, _, _) => _imagePlaceholder(116),
                      )
                    else
                      _imagePlaceholder(116),
                    if (promotion.discountText != null)
                      Positioned(
                        left: 10,
                        top: 10,
                        child: _DiscountBadge(text: promotion.discountText!),
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
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 7),
                    Text(
                      promotion.business?.title ?? 'QalaGo',
                      style: const TextStyle(
                        color: Color(0xFF6F7683),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (promotion.description != null) ...[
                      const SizedBox(height: 7),
                      Text(
                        promotion.description!,
                        style: const TextStyle(
                          color: Color(0xFF6F7683),
                          fontSize: 12,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PopularPlacesCarousel extends StatelessWidget {
  const _PopularPlacesCarousel({
    required this.items,
    required this.index,
    required this.onPrevious,
    required this.onNext,
  });

  final List<RecommendedBusiness> items;
  final int index;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const SizedBox(
        height: 120,
        child: Center(child: Text('Нет популярных заведений')),
      );
    }

    final canMove = items.length > 1;
    final effectiveIndex = index < items.length ? index : 0;

    return SizedBox(
      height: 194,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 320),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0.05, 0),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
            child: LayoutBuilder(
              key: ValueKey(effectiveIndex),
              builder: (context, constraints) {
                final cardCount = items.length >= 3 ? 3 : items.length;
                final visible = List.generate(cardCount, (offset) {
                  return items[(effectiveIndex + offset) % items.length];
                });

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (var i = 0; i < visible.length; i++) ...[
                      Expanded(
                        child: _PopularPlaceCard(
                          business: visible[i].business,
                          subtitle: visible[i].reason,
                        ),
                      ),
                      if (i != visible.length - 1) const SizedBox(width: 12),
                    ],
                  ],
                );
              },
            ),
          ),
          if (canMove) ...[
            Positioned(
              left: -12,
              top: 46,
              child: _RoundNavButton(
                tooltip: 'Предыдущее заведение',
                icon: Icons.chevron_left,
                onPressed: onPrevious,
              ),
            ),
            Positioned(
              right: -12,
              top: 46,
              child: _RoundNavButton(
                tooltip: 'Следующее заведение',
                icon: Icons.chevron_right,
                onPressed: onNext,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PopularPlaceCard extends StatelessWidget {
  const _PopularPlaceCard({
    required this.business,
    required this.subtitle,
  });

  final BusinessModel business;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);

    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/business/${business.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 100,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (coverUrl.isNotEmpty)
                      Image.network(
                        coverUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _imagePlaceholder(null),
                      )
                    else
                      _imagePlaceholder(null),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.9),
                          shape: BoxShape.circle,
                        ),
                        child: const Padding(
                          padding: EdgeInsets.all(5),
                          child: Icon(
                            Icons.favorite_border,
                            color: Colors.black,
                            size: 19,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    business.title,
                    style: const TextStyle(
                      color: Colors.black,
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      height: 1.1,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 7),
                  Row(
                    children: [
                      Icon(
                        Icons.star,
                        color: business.isTopCity
                            ? AppTheme.kzGold
                            : business.isVipPro
                                ? AppTheme.kzBlue
                                : AppTheme.kzBlue,
                        size: 17,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          subtitle.isNotEmpty
                              ? subtitle
                              : (business.planBadgeLabel ??
                                  business.categoryTitle ??
                                  'QalaGo'),
                          style: const TextStyle(
                            color: Color(0xFF6F7683),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NearbyBusinessList extends StatelessWidget {
  const _NearbyBusinessList({required this.items});

  final List<BusinessModel> items;

  static const _maxPreviewItems = 12;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(
          child: Text(
            'В радиусе 3 км от вас пока нет заведений',
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    final tiers = splitBusinessesByTier(items);
    final preview = <BusinessModel>[];
    for (final group in [tiers.top, tiers.pro, tiers.regular]) {
      for (final business in group) {
        if (preview.length >= _maxPreviewItems) break;
        preview.add(business);
      }
      if (preview.length >= _maxPreviewItems) break;
    }

    final previewTop = preview.where(isTopBusiness).toList();
    final previewPro = preview.where(isProBusiness).toList();
    final previewRegular = preview
        .where((b) => !isTopBusiness(b) && !isProBusiness(b))
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (previewTop.isNotEmpty) ...[
          const _NearbySubheader(
            title: 'Топ города',
            icon: Icons.emoji_events_outlined,
          ),
          const SizedBox(height: 8),
          for (final business in previewTop) ...[
            _NearbyBusinessTile(business: business, emphasizePlan: true),
            const SizedBox(height: 12),
          ],
        ],
        if (previewPro.isNotEmpty) ...[
          if (previewTop.isNotEmpty) const SizedBox(height: 4),
          const _NearbySubheader(
            title: 'VIP · Pro',
            icon: Icons.workspace_premium_outlined,
          ),
          const SizedBox(height: 8),
          for (final business in previewPro) ...[
            _NearbyBusinessTile(business: business, emphasizePlan: true),
            const SizedBox(height: 12),
          ],
        ],
        if (previewRegular.isNotEmpty) ...[
          if (previewTop.isNotEmpty || previewPro.isNotEmpty)
            const SizedBox(height: 4),
          _NearbySubheader(
            title: previewTop.isEmpty && previewPro.isEmpty
                ? 'Заведения'
                : 'Все остальные',
            icon: Icons.near_me_outlined,
          ),
          const SizedBox(height: 8),
          for (final business in previewRegular) ...[
            _NearbyBusinessTile(business: business),
            const SizedBox(height: 12),
          ],
        ],
      ],
    );
  }
}

class _NearbySubheader extends StatelessWidget {
  const _NearbySubheader({required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.kzBlue),
        const SizedBox(width: 6),
        Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 15,
            color: AppTheme.kzBlue,
          ),
        ),
      ],
    );
  }
}

class _NearbyBusinessTile extends StatelessWidget {
  const _NearbyBusinessTile({
    required this.business,
    this.emphasizePlan = false,
  });

  final BusinessModel business;
  final bool emphasizePlan;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);

    return Material(
      color: emphasizePlan ? AppTheme.kzBlue.withValues(alpha: 0.03) : Colors.white,
      elevation: emphasizePlan ? 3 : 2,
      shadowColor: Colors.black.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/business/${business.id}'),
        child: DecoratedBox(
          decoration: emphasizePlan
              ? BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: business.isTopCity
                        ? AppTheme.kzGold.withValues(alpha: 0.7)
                        : AppTheme.kzBlue.withValues(alpha: 0.35),
                  ),
                )
              : const BoxDecoration(),
          child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: coverUrl.isNotEmpty
                    ? Image.network(
                        coverUrl,
                        width: 112,
                        height: 92,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _imagePlaceholder(92),
                      )
                    : _imagePlaceholder(92, width: 112),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            business.title,
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (business.planBadgeLabel != null)
                          _SmallStatusPill(text: business.planBadgeLabel!),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      business.categoryTitle ?? 'Заведение',
                      style: const TextStyle(
                        color: Color(0xFF7B8291),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (business.shortDesc != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        business.shortDesc!,
                        style: const TextStyle(
                          color: Color(0xFF596171),
                          fontSize: 13,
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          color: Color(0xFF8A919F),
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            business.distanceMeters != null
                                ? '${formatDistanceMeters(business.distanceMeters)} · ${business.address}'
                                : business.address,
                            style: const TextStyle(
                              color: Color(0xFF8A919F),
                              fontSize: 12,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
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
      ),
    );
  }
}

class _RoundNavButton extends StatelessWidget {
  const _RoundNavButton({
    required this.tooltip,
    required this.icon,
    required this.onPressed,
  });

  final String tooltip;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 3,
      shadowColor: Colors.black.withValues(alpha: 0.16),
      shape: const CircleBorder(),
      child: IconButton(
        tooltip: tooltip,
        onPressed: onPressed,
        icon: Icon(icon, color: AppTheme.kzBlue, size: 26),
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

class _SmallStatusPill extends StatelessWidget {
  const _SmallStatusPill({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppTheme.kzGold.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(
          text,
          style: const TextStyle(
            color: Colors.black,
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

Widget _imagePlaceholder(double? height, {double? width}) {
  return Container(
    width: width ?? double.infinity,
    height: height,
    color: const Color(0xFFF0F2F5),
    child: const Center(
      child: Icon(Icons.storefront, color: Color(0xFF9AA1AD)),
    ),
  );
}
