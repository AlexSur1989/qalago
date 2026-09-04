import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/city_picker.dart';
import '../../../shared/widgets/qalago_logo.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
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
    context.push('/business/${business.id}');
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
      backgroundColor: Colors.white,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.kzBlue,
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
                  color: Colors.black,
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _searchController,
                onChanged: (value) => setState(() => _search = value),
                decoration: InputDecoration(
                  hintText: 'Поиск акций...',
                  prefixIcon: const Icon(
                    Icons.search,
                    color: Color(0xFF8A919F),
                  ),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          tooltip: 'Очистить',
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _search = '');
                          },
                          icon: const Icon(Icons.cancel),
                        )
                      : null,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(
                      color: Colors.black.withValues(alpha: 0.08),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(
                      color: AppTheme.kzBlue,
                      width: 1.4,
                    ),
                  ),
                ),
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
                                color: selected ? Colors.white : Colors.black,
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
                              color: selected ? Colors.white : Colors.black,
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
                error: (e, _) => ErrorView(
                  message: '$e',
                  onRetry: () => ref.invalidate(promotionsProvider),
                ),
                data: (paginated) {
                  final items = _filtered(paginated.items);
                  if (items.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: Text('Акций пока нет')),
                    );
                  }

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Найдено ${items.length} акций',
                        style: const TextStyle(
                          color: Color(0xFF6F7683),
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

    return Material(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.1),
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
                            color: AppTheme.kzBlue,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 6,
                            ),
                            child: Text(
                              promotion.discountText!,
                              style: const TextStyle(
                                color: Colors.white,
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
                              color: Colors.black,
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right,
                          color: AppTheme.kzBlue,
                          size: 26,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      promotion.title,
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (promotion.description != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        promotion.description!,
                        style: const TextStyle(
                          color: Color(0xFF6F7683),
                          fontSize: 13,
                          height: 1.22,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 10),
                    const Row(
                      children: [
                        Icon(
                          Icons.calendar_month_outlined,
                          color: Color(0xFF8A919F),
                          size: 17,
                        ),
                        SizedBox(width: 5),
                        Text(
                          'Активно сейчас',
                          style: TextStyle(
                            color: Color(0xFF6F7683),
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
    color: const Color(0xFFF0F2F5),
    child: const Center(
      child: Icon(Icons.local_offer_outlined, color: Color(0xFF8A919F)),
    ),
  );
}
