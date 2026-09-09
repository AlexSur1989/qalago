import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';

import '../../../core/location/user_location_provider.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../analytics/widgets/tracked_business_card.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../search_filters.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({
    super.key,
    this.initialQuery,
    this.categoryId,
    this.initialRadiusKm,
  });

  final String? initialQuery;
  final String? categoryId;
  final String? initialRadiusKm;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _controller;
  String _query = '';
  String? _resultAttributionQuery;
  String? _categoryId;
  SearchRadiusMode _radiusMode = SearchRadiusMode.wholeCity;
  Timer? _debounce;
  bool _syncingRoute = false;

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery?.trim() ?? '';
    _categoryId = widget.categoryId;
    _radiusMode = SearchRadiusModeX.fromRadiusKmParam(widget.initialRadiusKm);
    _controller = TextEditingController(text: _query);
    _controller.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  bool get _hasActiveSearch => _query.isNotEmpty || _categoryId != null;

  bool get _hasNarrowFilters =>
      _query.isNotEmpty ||
      _categoryId != null ||
      _radiusMode != SearchRadiusMode.wholeCity;

  BusinessesQuery _buildQuery() {
    if (_radiusMode == SearchRadiusMode.wholeCity) {
      return BusinessesQuery(
        search: _query.isEmpty ? null : _query,
        categoryId: _categoryId,
      );
    }
    final position = ref.read(nearbySearchPositionProvider);
    return BusinessesQuery(
      search: _query.isEmpty ? null : _query,
      categoryId: _categoryId,
      latitude: position.latitude,
      longitude: position.longitude,
      radiusKm: _radiusMode.radiusKm,
    );
  }

  void _syncRoute() {
    if (_syncingRoute || !mounted) return;
    _syncingRoute = true;
    final params = buildSearchRouteParams(
      query: _query,
      categoryId: _categoryId,
      radiusMode: _radiusMode,
    );
    final uri = Uri(path: '/search', queryParameters: params.isEmpty ? null : params);
    context.go(uri.toString());
    _syncingRoute = false;
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 320), () {
      if (!mounted) return;
      final next = value.trim();
      if (next == _query) return;
      setState(() => _query = next);
      _syncRoute();
    });
  }

  void _clearQuery() {
    _debounce?.cancel();
    _controller.clear();
    if (_query.isEmpty) return;
    setState(() => _query = '');
    _syncRoute();
  }

  void _resetFilters() {
    _debounce?.cancel();
    _controller.clear();
    setState(() {
      _query = '';
      _categoryId = null;
      _radiusMode = SearchRadiusMode.wholeCity;
    });
    _syncRoute();
  }

  void _setCategory(String? id) {
    setState(() => _categoryId = id);
    _syncRoute();
  }

  void _setRadius(SearchRadiusMode mode) {
    setState(() => _radiusMode = mode);
    _syncRoute();
  }

  String? _categoryTitle(List<CategoryModel> categories) {
    if (_categoryId == null) return null;
    for (final c in categories) {
      if (c.id == _categoryId) return c.title;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final city = ref.watch(cityProvider);
    final query = _buildQuery();
    final businessesAsync = ref.watch(businessesProvider(query));
    final categoriesAsync = ref.watch(categoriesProvider);

    ref.listen(businessesProvider(query), (previous, next) {
      next.whenData((_) {
        if (mounted) {
          setState(() => _resultAttributionQuery = query.search);
        }
      });
    });

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F7FA),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        title: TextField(
          controller: _controller,
          autofocus: _query.isEmpty && _categoryId == null,
          textInputAction: TextInputAction.search,
          onChanged: _onQueryChanged,
          onSubmitted: (value) {
            _debounce?.cancel();
            setState(() => _query = value.trim());
            _syncRoute();
          },
          decoration: InputDecoration(
            hintText: 'Поиск заведений и услуг...',
            prefixIcon: const Icon(Icons.search, color: Color(0xFF8A919F)),
            suffixIcon: _controller.text.isNotEmpty
                ? IconButton(
                    tooltip: 'Очистить',
                    onPressed: _clearQuery,
                    icon: const Icon(Icons.cancel, color: Color(0xFF8A919F)),
                  )
                : null,
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.08)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.08)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.kzBlue, width: 1.4),
            ),
          ),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          categoriesAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (categories) {
              final categoryTitle = _categoryTitle(categories);
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _CategoryChips(
                    categories: categories,
                    selectedId: _categoryId,
                    onSelected: _setCategory,
                  ),
                  _RadiusChips(
                    selected: _radiusMode,
                    onSelected: _setRadius,
                  ),
                  if (_hasNarrowFilters)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              buildSearchFilterSummary(
                                cityName: city.nameRu,
                                categoryTitle: categoryTitle,
                                radiusMode: _radiusMode,
                                query: _query,
                              ),
                              style: const TextStyle(
                                color: Color(0xFF596171),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: _resetFilters,
                            child: const Text('Сбросить'),
                          ),
                        ],
                      ),
                    ),
                ],
              );
            },
          ),
          Expanded(
            child: businessesAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                message: 'Не удалось выполнить поиск.\n$e',
                onRetry: () => ref.invalidate(businessesProvider(query)),
              ),
              data: (data) {
                if (!_hasActiveSearch) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'Введите название или выберите категорию',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Color(0xFF7B8291)),
                      ),
                    ),
                  );
                }
                if (data.items.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _emptyMessage(city.nameRu),
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Color(0xFF7B8291)),
                          ),
                          if (_hasNarrowFilters) ...[
                            const SizedBox(height: 16),
                            OutlinedButton(
                              onPressed: _resetFilters,
                              child: const Text('Сбросить фильтры'),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  itemCount: data.items.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return Text(
                        'Найдено: ${data.total}',
                        style: const TextStyle(
                          color: Color(0xFF7B8291),
                          fontWeight: FontWeight.w600,
                        ),
                      );
                    }
                    final business = data.items[index - 1];
                    final attributionQuery =
                        _resultAttributionQuery ?? query.search;
                    return TrackedBusinessCard(
                      business: business,
                      trafficSource: BusinessTrafficSource.search,
                      searchQuery: attributionQuery,
                      position: index - 1,
                      onTap: () => openBusiness(
                            context,
                            business.id,
                            BusinessTrafficSource.search,
                            searchQuery: attributionQuery,
                          ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _emptyMessage(String cityName) {
    if (_query.isNotEmpty && _categoryId != null) {
      return 'Ничего не найдено по запросу «$_query» в выбранной категории';
    }
    if (_query.isNotEmpty) {
      return 'Ничего не найдено по запросу «$_query» в $cityName';
    }
    if (_categoryId != null && _radiusMode != SearchRadiusMode.wholeCity) {
      return 'Нет заведений в выбранной категории ${_radiusMode.label.toLowerCase()}';
    }
    return 'Нет заведений в выбранной категории';
  }
}

class _CategoryChips extends StatelessWidget {
  const _CategoryChips({
    required this.categories,
    required this.selectedId,
    required this.onSelected,
  });

  final List<CategoryModel> categories;
  final String? selectedId;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: const Text('Все категории'),
              selected: selectedId == null,
              onSelected: (_) => onSelected(null),
              selectedColor: AppTheme.kzBlue.withValues(alpha: 0.15),
              checkmarkColor: AppTheme.kzBlue,
            ),
          ),
          for (final category in categories)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(category.title),
                selected: selectedId == category.id,
                onSelected: (_) => onSelected(category.id),
                selectedColor: AppTheme.kzBlue.withValues(alpha: 0.15),
                checkmarkColor: AppTheme.kzBlue,
              ),
            ),
        ],
      ),
    );
  }
}

class _RadiusChips extends StatelessWidget {
  const _RadiusChips({
    required this.selected,
    required this.onSelected,
  });

  final SearchRadiusMode selected;
  final ValueChanged<SearchRadiusMode> onSelected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
        children: [
          for (final mode in SearchRadiusMode.values)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(mode.label),
                selected: selected == mode,
                onSelected: (_) => onSelected(mode),
                selectedColor: AppTheme.kzBlue.withValues(alpha: 0.15),
                checkmarkColor: AppTheme.kzBlue,
              ),
            ),
        ],
      ),
    );
  }
}
