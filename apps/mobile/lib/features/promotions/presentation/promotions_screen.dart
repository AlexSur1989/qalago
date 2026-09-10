import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/utils/consumer_discovery_utils.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/qalago_search_field.dart';
import '../../auth/providers/auth_provider.dart';

class PromotionsScreen extends ConsumerStatefulWidget {
  const PromotionsScreen({super.key});

  @override
  ConsumerState<PromotionsScreen> createState() => _PromotionsScreenState();
}

class _PromotionsScreenState extends ConsumerState<PromotionsScreen> {
  final _searchController = TextEditingController();
  String _search = '';
  String? _categoryFilterId;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openPromotion(PromotionModel promotion) {
    final business = promotion.business;
    if (business == null) return;
    unawaited(
      ref.read(catalogRepositoryProvider).trackPromotionView(business.id),
    );
    openBusiness(context, business.id, BusinessTrafficSource.promotions);
  }

  List<PromotionModel> _filtered(List<PromotionModel> items) {
    final search = _search.trim().toLowerCase();
    return items.where((promotion) {
      final haystack = [
        promotion.title,
        promotion.description,
        promotion.discountText,
        promotion.business?.title,
        promotion.business?.shortDesc,
        promotion.business?.categoryTitle,
      ].whereType<String>().join(' ').toLowerCase();
      final matchesSearch = search.isEmpty || haystack.contains(search);
      final matchesCategory = _categoryFilterId == null ||
          promotion.business?.categoryId == _categoryFilterId;
      return matchesSearch && matchesCategory;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final promotionsAsync = ref.watch(promotionsProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final city = ref.watch(cityProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: Theme.of(context).colorScheme.primary,
          onRefresh: () async => ref.invalidate(promotionsProvider),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            children: [
              _PromotionsHeader(
                cityName: city.nameRu,
                onCityTap: () => showCityPickerSheet(context, ref),
              ),
              const SizedBox(height: 24),
              const Text(
                'Акции',
                style: TextStyle(
                  color: AppTheme.textDark,
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
              ),
              const SizedBox(height: 16),
              QalagoSearchField(
                controller: _searchController,
                hintText: 'Поиск акций...',
                onChanged: (value) => setState(() => _search = value),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        tooltip: 'Очистить',
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _search = '');
                        },
                        icon: Icon(
                          Icons.cancel,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      )
                    : null,
              ),
              const SizedBox(height: 16),
              categoriesAsync.when(
                loading: () => const SizedBox(height: 44),
                error: (_, __) => const SizedBox(height: 44),
                data: (categories) {
                  if (categories.isEmpty) return const SizedBox(height: 44);
                  return SizedBox(
                    height: 44,
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
                        itemCount: categories.length + 1,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (context, index) {
                          if (index == 0) {
                            final selected = _categoryFilterId == null;
                            return ChoiceChip(
                              selected: selected,
                              label: const Text('Все'),
                              showCheckmark: false,
                              onSelected: (_) =>
                                  setState(() => _categoryFilterId = null),
                              selectedColor: AppTheme.kzBlue,
                              labelStyle: TextStyle(
                                color: selected
                                    ? Theme.of(context).colorScheme.onPrimary
                                    : Theme.of(context).colorScheme.onSurface,
                                fontWeight: FontWeight.w700,
                              ),
                            );
                          }
                          final category = categories[index - 1];
                          final selected = _categoryFilterId == category.id;
                          return ChoiceChip(
                            selected: selected,
                            label: Text(category.title),
                            showCheckmark: false,
                            onSelected: (_) => setState(
                              () => _categoryFilterId =
                                  selected ? null : category.id,
                            ),
                            selectedColor: AppTheme.kzBlue,
                            labelStyle: TextStyle(
                              color: selected
                                  ? Theme.of(context).colorScheme.onPrimary
                                  : Theme.of(context).colorScheme.onSurface,
                              fontWeight: FontWeight.w700,
                            ),
                          );
                        },
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 22),
              promotionsAsync.when(
                loading: () => const LoadingView(),
                error: (_, __) => ErrorView(
                  message: 'Не удалось загрузить акции. Проверьте подключение.',
                  onRetry: () => ref.invalidate(promotionsProvider),
                ),
                data: (paginated) {
                  final active = filterActivePromotionModels(paginated.items);
                  final items = _filtered(active);

                  if (active.isEmpty) {
                    return _PromotionsEmptyCity(cityName: city.nameRu);
                  }

                  if (items.isEmpty) {
                    return const _PromotionsEmptyFilter();
                  }

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Найдено ${items.length} акций',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 14),
                      ...items.map(
                        (promotion) => Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: _PromotionListCard(
                            promotion: promotion,
                            onTap: () => _openPromotion(promotion),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PromotionsEmptyCity extends StatelessWidget {
  const _PromotionsEmptyCity({required this.cityName});

  final String cityName;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          CircleAvatar(
            radius: 42,
            backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.1),
            child: Icon(
              Icons.local_offer_outlined,
              color: Theme.of(context).colorScheme.primary,
              size: 42,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'В $cityName пока нет активных акций',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.textDark,
              fontSize: 20,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Загляните позже — заведения регулярно добавляют новые предложения.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.textMuted, height: 1.35),
          ),
        ],
      ),
    );
  }
}

class _PromotionsEmptyFilter extends StatelessWidget {
  const _PromotionsEmptyFilter();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          Icon(Icons.search_off, size: 48, color: AppTheme.textMuted),
          SizedBox(height: 16),
          Text(
            'Ничего не найдено',
            style: TextStyle(
              color: AppTheme.textDark,
              fontSize: 20,
              fontWeight: FontWeight.w900,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Попробуйте изменить поиск или категорию.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.textMuted, height: 1.35),
          ),
        ],
      ),
    );
  }
}

class _PromotionsHeader extends StatelessWidget {
  const _PromotionsHeader({
    required this.cityName,
    required this.onCityTap,
  });

  final String cityName;
  final VoidCallback onCityTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: QalaGoLogo(fontSize: 36)),
        CityPill(cityName: cityName, onTap: onCityTap),
        const SizedBox(width: 8),
        IconButton(
          onPressed: () => context.push('/notifications'),
          icon: const Icon(Icons.notifications_none_rounded, size: 31),
        ),
      ],
    );
  }
}

class _PromotionListCard extends StatelessWidget {
  const _PromotionListCard({required this.promotion, required this.onTap});

  final PromotionModel promotion;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final imageUrl = AppConstants.resolveMediaUrl(
      promotion.imageUrl ?? promotion.business?.coverImageUrl,
    );
    final validity = formatPromotionValidity(promotion);
    final benefit = promotion.description ?? promotion.discountText;

    final cs = Theme.of(context).colorScheme;
    return Material(
      color: cs.surface,
      elevation: 2,
      shadowColor: cs.onSurface.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: promotion.business != null ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  children: [
                    if (imageUrl.isNotEmpty)
                      Image.network(
                        imageUrl,
                        width: 150,
                        height: 126,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _promoPlaceholder(),
                      )
                    else
                      _promoPlaceholder(),
                    if (promotion.discountText != null)
                      Positioned(
                        left: 8,
                        top: 8,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 6,
                            ),
                            child: Text(
                              promotion.discountText!,
                              style: TextStyle(
                                color: cs.onPrimary,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
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
                            promotion.business?.title ?? 'QalaGo',
                            style: const TextStyle(
                              color: AppTheme.textDark,
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          color: Theme.of(context).colorScheme.primary,
                          size: 26,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      promotion.title,
                      style: const TextStyle(
                        color: AppTheme.textDark,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (benefit != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        benefit,
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 13,
                          height: 1.22,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_month_outlined,
                          color: AppTheme.textMuted,
                          size: 17,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          validity,
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
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

Widget _promoPlaceholder() {
  return Container(
    width: 150,
    height: 126,
    color: AppTheme.background,
    child: const Center(
      child: Icon(Icons.local_offer_outlined, color: AppTheme.textMuted),
    ),
  );
}
