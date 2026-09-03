import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/qalago_logo.dart';
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
  final _searchController = TextEditingController();
  String _search = '';
  Timer? _searchDebounce;
  Timer? _featuredTimer;
  int _featuredIndex = 0;
  int _featuredItemsCount = 0;

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _featuredTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  BusinessesQuery get _businessesQuery => BusinessesQuery(
    search: _search.isEmpty ? null : _search,
  );

  void _queueSearch(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 320), () {
      if (!mounted) return;
      final next = value.trim();
      if (next == _search) return;
      setState(() => _search = next);
    });
  }

  void _submitSearch(String value) {
    _searchDebounce?.cancel();
    final next = value.trim();
    if (next == _search) return;
    setState(() => _search = next);
  }

  void _clearSearch() {
    _searchDebounce?.cancel();
    _searchController.clear();
    if (_search.isEmpty) return;
    setState(() => _search = '');
  }

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
    final cities = await ref.read(citiesProvider.future);
    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Text(
                  'Выберите город',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
              ...cities.map((c) {
                final slug = c['slug'] as String? ?? '';
                final name = c['nameRu'] as String? ?? slug;
                final isSelected = ref.watch(cityProvider).slug == slug;
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 24),
                  title: Text(
                    name,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                      color: isSelected ? AppTheme.kzBlue : Colors.black87,
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check_circle, color: AppTheme.kzBlue)
                      : null,
                  onTap: () async {
                    final cityId = c['id'] as String? ?? '';
                    await ref
                        .read(cityProvider.notifier)
                        .selectCity(slug, name);
                    if (cityId.isNotEmpty &&
                        ref.read(authProvider).isAuthenticated) {
                      try {
                        await ref.read(authProvider.notifier).setPreferredCity(
                              cityId: cityId,
                              slug: slug,
                              nameRu: name,
                            );
                      } catch (_) {
                        // Local city already switched; profile sync can retry later.
                      }
                    } else {
                      ref.invalidate(businessesProvider);
                      ref.invalidate(featuredBusinessesProvider);
                      ref.invalidate(promotionsProvider);
                    }
                    if (ctx.mounted) Navigator.pop(ctx);
                  },
                );
              }),
            ],
          ),
        ),
      ),
    );
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
    final categoriesAsync = ref.watch(categoriesProvider);
    final businessesAsync = ref.watch(businessesProvider(_businessesQuery));
    final featuredAsync = ref.watch(featuredBusinessesProvider);
    final promotionsAsync = ref.watch(promotionsProvider);
    final unreadAsync = ref.watch(unreadNotificationsProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.kzBlue,
          onRefresh: () async {
            ref.invalidate(categoriesProvider);
            ref.invalidate(businessesProvider);
            ref.invalidate(featuredBusinessesProvider);
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
                        controller: _searchController,
                        onChanged: _queueSearch,
                        onSubmitted: _submitSearch,
                        onClear: _clearSearch,
                      ),
                      const SizedBox(height: 20),
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
                        title: 'Популярные места',
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
                              ref.invalidate(featuredBusinessesProvider),
                        ),
                        data: (data) {
                          final items = data.items;
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
                      _SectionHeader(
                        title: _search.isEmpty ? 'Рядом с вами' : 'Найденные места',
                        actionLabel: _search.isNotEmpty ? 'Сбросить' : null,
                        onAction: _search.isNotEmpty ? _clearSearch : null,
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
        _CityPill(cityName: cityName, onTap: onCityTap),
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

class _CityPill extends StatelessWidget {
  const _CityPill({required this.cityName, required this.onTap});

  final String cityName;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: Colors.black.withValues(alpha: 0.09)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.location_on, color: AppTheme.kzBlue, size: 20),
              const SizedBox(width: 6),
              Text(
                cityName,
                style: const TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
              const SizedBox(width: 2),
              const Icon(
                Icons.keyboard_arrow_down,
                color: Color(0xFF808796),
                size: 20,
              ),
            ],
          ),
        ),
      ),
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

class _SearchBox extends StatefulWidget {
  const _SearchBox({
    required this.controller,
    required this.onChanged,
    required this.onSubmitted,
    required this.onClear,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSubmitted;
  final VoidCallback onClear;

  @override
  State<_SearchBox> createState() => _SearchBoxState();
}

class _SearchBoxState extends State<_SearchBox> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_refresh);
  }

  @override
  void didUpdateWidget(covariant _SearchBox oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller == widget.controller) return;
    oldWidget.controller.removeListener(_refresh);
    widget.controller.addListener(_refresh);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_refresh);
    super.dispose();
  }

  void _refresh() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final hasText = widget.controller.text.isNotEmpty;

    return TextField(
      controller: widget.controller,
      textInputAction: TextInputAction.search,
      onChanged: widget.onChanged,
      onSubmitted: widget.onSubmitted,
      decoration: InputDecoration(
        hintText: 'Поиск заведений и услуг...',
        prefixIcon: const Icon(Icons.search, color: Color(0xFF8A919F)),
        suffixIcon: hasText
            ? IconButton(
                tooltip: 'Очистить',
                onPressed: widget.onClear,
                icon: const Icon(Icons.cancel, color: Color(0xFF8A919F)),
              )
            : null,
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

    final cardWidth = _homeCategoryCardWidth(context, categories);

    return SizedBox(
      height: 138,
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
          itemCount: categories.length,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            final category = categories[index];
            return _CategoryPhotoCard(
              category: category,
              width: cardWidth,
              onTap: () => onSelected(category),
            );
          },
        ),
      ),
    );
  }
}

class _CategoryPhotoCard extends StatelessWidget {
  const _CategoryPhotoCard({
    required this.category,
    required this.width,
    required this.onTap,
  });

  final CategoryModel category;
  final double width;
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
          width: width,
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
                bottom: 12,
                child: FittedBox(
                  alignment: Alignment.centerLeft,
                  fit: BoxFit.scaleDown,
                  child: Text(
                    _categoryShortTitle(category),
                    maxLines: 1,
                    softWrap: false,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      height: 1.05,
                    ),
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
    this.actionLabel = 'Смотреть все',
    this.onAction,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
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

  final List<BusinessModel> items;
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
                      Expanded(child: _PopularPlaceCard(business: visible[i])),
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
  const _PopularPlaceCard({required this.business});

  final BusinessModel business;

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
                        color: business.isFeatured
                            ? AppTheme.kzGold
                            : AppTheme.kzBlue,
                        size: 17,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          business.isFeatured
                              ? 'Топ'
                              : business.categoryTitle ?? 'QalaGo',
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

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: Text('Нет заведений')),
      );
    }

    return Column(
      children: [
        for (final business in items.take(8)) ...[
          _NearbyBusinessTile(business: business),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _NearbyBusinessTile extends StatelessWidget {
  const _NearbyBusinessTile({required this.business});

  final BusinessModel business;

  @override
  Widget build(BuildContext context) {
    final coverUrl = AppConstants.resolveMediaUrl(business.coverImageUrl);

    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/business/${business.id}'),
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
                        if (business.isFeatured)
                          const _SmallStatusPill(text: 'Топ'),
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
                            business.address,
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

double _homeCategoryCardWidth(
  BuildContext context,
  List<CategoryModel> categories,
) {
  final longestLabel = categories.map(_categoryShortTitle).fold<String>('', (
    longest,
    label,
  ) {
    return label.length > longest.length ? label : longest;
  });
  final painter = TextPainter(
    text: TextSpan(
      text: longestLabel,
      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
    ),
    maxLines: 1,
    textDirection: TextDirection.ltr,
    textScaler: MediaQuery.textScalerOf(context),
  )..layout();

  return (painter.width + 18).clamp(94.0, 104.0);
}

String _categoryShortTitle(CategoryModel category) {
  switch (category.slug) {
    case 'food':
      return 'Еда';
    case 'bars':
      return 'Бары';
    case 'fitness':
      return 'Фитнес';
    case 'beauty':
      return 'Красота';
    case 'shops':
      return 'Магазины';
    case 'medicine':
      return 'Медицина';
    case 'kids':
      return 'Детям';
    case 'services':
      return 'Услуги';
    case 'fun':
      return 'Развлечения';
    case 'auto':
      return 'Авто';
    default:
      return category.title;
  }
}
