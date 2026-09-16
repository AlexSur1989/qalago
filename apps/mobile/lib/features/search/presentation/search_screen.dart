import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/location/user_location_provider.dart';
import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/consumer_api_errors.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/qalago_spacing.dart';
import '../../../core/theme/qalago_touch_targets.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/models/models.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/navigation/open_business.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../../shared/widgets/qalago_search_field.dart';
import '../../analytics/providers/analytics_identity_provider.dart';
import '../../analytics/widgets/tracked_business_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../../categories/utils/category_display.dart';
import '../../home/presentation/home_layout.dart';
import '../search_filters.dart';
import '../search_result_count.dart';
import 'search_filter_sections.dart';
import 'search_scope_chip.dart';

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
  late final FocusNode _focusNode;
  String _query = '';
  String? _resultAttributionQuery;
  String? _categoryId;
  SearchRadiusMode _radiusMode = SearchRadiusMode.wholeCity;
  Timer? _debounce;
  bool _syncingRoute = false;
  String? _lastSearchPerformedQuery;
  int _fetchGeneration = 0;

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery?.trim() ?? '';
    _categoryId = widget.categoryId;
    _radiusMode = SearchRadiusModeX.fromRadiusKmParam(widget.initialRadiusKm);
    _controller = TextEditingController(text: _query);
    _focusNode = FocusNode();
  }

  @override
  void didUpdateWidget(covariant SearchScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_syncingRoute) return;

    final nextQuery = widget.initialQuery?.trim() ?? '';
    final nextCategory = widget.categoryId;
    final nextRadius = SearchRadiusModeX.fromRadiusKmParam(widget.initialRadiusKm);

    if (nextQuery == _query &&
        nextCategory == _categoryId &&
        nextRadius == _radiusMode) {
      return;
    }

    _debounce?.cancel();
    setState(() {
      _query = nextQuery;
      _categoryId = nextCategory;
      _radiusMode = nextRadius;
      _fetchGeneration++;
    });
    if (_controller.text != nextQuery) {
      _controller.text = nextQuery;
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _focusNode.dispose();
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
    if (GoRouter.maybeOf(context) != null) {
      context.go(uri.toString());
    }
    _syncingRoute = false;
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 320), () {
      if (!mounted) return;
      final next = value.trim();
      if (next == _query) return;
      setState(() {
        _query = next;
        _fetchGeneration++;
      });
      _syncRoute();
    });
  }

  void _clearQuery() {
    _debounce?.cancel();
    _controller.clear();
    if (_query.isEmpty) {
      _focusNode.requestFocus();
      return;
    }
    setState(() {
      _query = '';
      _fetchGeneration++;
    });
    _syncRoute();
    _focusNode.requestFocus();
  }

  void _clearCategoryScope() {
    if (_categoryId == null) return;
    setState(() {
      _categoryId = null;
      _fetchGeneration++;
    });
    _syncRoute();
  }

  void _resetFilters() {
    _debounce?.cancel();
    _controller.clear();
    setState(() {
      _query = '';
      _categoryId = null;
      _radiusMode = SearchRadiusMode.wholeCity;
      _fetchGeneration++;
    });
    _syncRoute();
    _focusNode.requestFocus();
  }

  void _setCategory(String? id) {
    setState(() {
      _categoryId = id;
      _fetchGeneration++;
    });
    _syncRoute();
  }

  void _setRadius(SearchRadiusMode mode) {
    setState(() {
      _radiusMode = mode;
      _fetchGeneration++;
    });
    _syncRoute();
  }

  void _trackSearchPerformedIfNeeded(String? searchQuery, int generation) {
    if (generation != _fetchGeneration) return;
    final normalized = searchQuery?.trim();
    if (normalized == null || normalized.isEmpty) return;
    if (_lastSearchPerformedQuery == normalized) return;
    _lastSearchPerformedQuery = normalized;

    final cities = ref.read(citiesProvider).valueOrNull;
    if (cities == null || cities.isEmpty) return;
    final citySlug = ref.read(cityProvider).slug;
    Map<String, dynamic>? cityMatch;
    for (final entry in cities) {
      if (entry['slug'] == citySlug) {
        cityMatch = entry;
        break;
      }
    }
    cityMatch ??= cities.first;
    final cityId = cityMatch['id'] as String?;
    if (cityId == null || cityId.isEmpty) return;

    final repo = ref.read(catalogRepositoryProvider);
    final sessionId = ref.read(analyticsSessionIdProvider);
    unawaited(
      ref.read(analyticsVisitorIdProvider.future).then(
            (visitorId) => repo.trackSearchPerformed(
              cityId: cityId,
              searchQuery: normalized,
              visitorId: visitorId,
              sessionId: sessionId,
            ),
          ),
    );
  }

  String _categoryScopeLabel(
    List<CategoryModel> categories,
    String localeCode,
    AppLocalizations l10n,
  ) {
    if (_categoryId == null) return '';
    for (final c in categories) {
      if (c.id == _categoryId) {
        return categoryDisplayName(c, localeCode: localeCode);
      }
    }
    return l10n.categoryFallbackTitle;
  }

  String? _categoryTitleForSummary(List<CategoryModel> categories) {
    if (_categoryId == null) return null;
    for (final c in categories) {
      if (c.id == _categoryId) return c.title;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final localeCode = resolveLocaleCode(ref.watch(appLocaleCodeProvider));
    final query = _buildQuery();
    final fetchGen = _fetchGeneration;
    final businessesAsync = ref.watch(businessesProvider(query));
    final categoriesAsync = ref.watch(categoriesProvider);

    ref.listen(businessesProvider(query), (previous, next) {
      next.whenData((_) {
        if (!mounted || fetchGen != _fetchGeneration) return;
        setState(() => _resultAttributionQuery = query.search);
        _trackSearchPerformedIfNeeded(query.search, fetchGen);
      });
    });

    final maxFilterHeight = MediaQuery.sizeOf(context).height * 0.38;

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                HomeLayout.horizontalPadding,
                HomeLayout.topPadding,
                HomeLayout.horizontalPadding,
                QalaGoSpacing.space8,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: QalaGoTouchTargets.minInteractive,
                    height: QalaGoTouchTargets.minInteractive,
                    child: qalagoBackLeading(
                      context,
                      fallbackLocation: '/home',
                    ),
                  ),
                  Expanded(
                    child: QalagoSearchField(
                      controller: _controller,
                      focusNode: _focusNode,
                      autofocus: _query.isEmpty && _categoryId == null,
                      textInputAction: TextInputAction.search,
                      hintText: l10n.searchPlaceholder,
                      onChanged: _onQueryChanged,
                      onSubmitted: (value) {
                        _debounce?.cancel();
                        setState(() {
                          _query = value.trim();
                          _fetchGeneration++;
                        });
                        _syncRoute();
                      },
                      onClear: _clearQuery,
                      clearSemanticsLabel: l10n.searchClearTooltip,
                    ),
                  ),
                ],
              ),
            ),
            categoriesAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (categories) {
                final scopeLabel = _categoryId != null
                    ? _categoryScopeLabel(categories, localeCode, l10n)
                    : null;
                final categoryTitle = _categoryTitleForSummary(categories);
                return ConstrainedBox(
                  constraints: BoxConstraints(maxHeight: maxFilterHeight),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(
                      horizontal: HomeLayout.horizontalPadding,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (scopeLabel != null)
                          SearchScopeChip(
                            label: scopeLabel,
                            l10n: l10n,
                            onClear: _clearCategoryScope,
                          ),
                        SearchCategoryFilterWrap(
                          categories: categories,
                          selectedId: _categoryId,
                          localeCode: localeCode,
                          onSelected: _setCategory,
                        ),
                        const SizedBox(height: QalaGoSpacing.space8),
                        SearchRadiusFilterWrap(
                          selected: _radiusMode,
                          l10n: l10n,
                          onSelected: _setRadius,
                        ),
                        if (_hasNarrowFilters) ...[
                          const SizedBox(height: QalaGoSpacing.space8),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Text(
                                  buildSearchFilterSummary(
                                    cityName:
                                        ref.watch(cityLocalizedNameProvider),
                                    categoryTitle: categoryTitle,
                                    radiusMode: _radiusMode,
                                    query: _query,
                                    l10n: l10n,
                                  ),
                                  style: const TextStyle(
                                    color: AppTheme.textMuted,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: _resetFilters,
                                child: Text(l10n.commonReset),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: QalaGoSpacing.space8),
                      ],
                    ),
                  ),
                );
              },
            ),
            Expanded(
              child: _SearchResultsPane(
                businessesAsync: businessesAsync,
                hasActiveSearch: _hasActiveSearch,
                hasNarrowFilters: _hasNarrowFilters,
                query: query,
                resultAttributionQuery: _resultAttributionQuery,
                emptyMessage: _emptyMessage(
                  l10n,
                  ref.watch(cityLocalizedNameProvider),
                ),
                onRetry: () => ref.invalidate(businessesProvider(query)),
                onResetFilters: _resetFilters,
                onClearCategoryScope:
                    _categoryId != null ? _clearCategoryScope : null,
                l10n: l10n,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _emptyMessage(AppLocalizations l10n, String cityName) {
    if (_query.isNotEmpty && _categoryId != null) {
      return l10n.searchNoResultsQueryCategory(_query);
    }
    if (_query.isNotEmpty) {
      return l10n.searchNoResultsQueryCity(_query, cityName);
    }
    if (_categoryId != null && _radiusMode != SearchRadiusMode.wholeCity) {
      return l10n.searchNoInCategoryRadius(
        _radiusMode.localizedLabel(l10n).toLowerCase(),
      );
    }
    return l10n.searchNoInCategory;
  }
}

class _SearchResultsPane extends StatelessWidget {
  const _SearchResultsPane({
    required this.businessesAsync,
    required this.hasActiveSearch,
    required this.hasNarrowFilters,
    required this.query,
    required this.resultAttributionQuery,
    required this.emptyMessage,
    required this.onRetry,
    required this.onResetFilters,
    required this.onClearCategoryScope,
    required this.l10n,
  });

  final AsyncValue<PaginatedBusinesses> businessesAsync;
  final bool hasActiveSearch;
  final bool hasNarrowFilters;
  final BusinessesQuery query;
  final String? resultAttributionQuery;
  final String emptyMessage;
  final VoidCallback onRetry;
  final VoidCallback onResetFilters;
  final VoidCallback? onClearCategoryScope;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    if (!hasActiveSearch) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(HomeLayout.horizontalPadding),
          child: Text(
            l10n.searchEnterQuery,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.textMuted),
          ),
        ),
      );
    }

    if (businessesAsync.hasError && !businessesAsync.hasValue) {
      return ErrorView(
        message: localizedLoadError(l10n, businessesAsync.error!),
        onRetry: onRetry,
      );
    }

    if (businessesAsync.isLoading && !businessesAsync.hasValue) {
      return Semantics(
        label: l10n.searchUpdatingResults,
        child: const LoadingView(),
      );
    }

    final data = businessesAsync.value!;
    final isUpdating = businessesAsync.isLoading;

    if (data.items.isEmpty && !isUpdating) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(HomeLayout.horizontalPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                emptyMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textMuted),
              ),
              if (onClearCategoryScope != null) ...[
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: onClearCategoryScope,
                  child: Text(l10n.searchClearCategoryScope),
                ),
              ],
              if (hasNarrowFilters) ...[
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: onResetFilters,
                  child: Text(l10n.searchResetFilters),
                ),
              ],
            ],
          ),
        ),
      );
    }

    final attributionQuery = resultAttributionQuery ?? query.search;
    final countLabel = formatSearchResultCount(l10n, data);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (isUpdating)
          Semantics(
            label: l10n.searchUpdatingResults,
            child: const LinearProgressIndicator(minHeight: 2),
          ),
        Expanded(
          child: ListView.separated(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: const EdgeInsets.fromLTRB(
              HomeLayout.horizontalPadding,
              QalaGoSpacing.space8,
              HomeLayout.horizontalPadding,
              HomeLayout.bottomPadding,
            ),
            itemCount: data.items.length + 1,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              if (index == 0) {
                return Text(
                  countLabel,
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w600,
                  ),
                );
              }
              final business = data.items[index - 1];
              return TrackedBusinessCard(
                business: business,
                trafficSource: BusinessTrafficSource.search,
                searchQuery: attributionQuery,
                position: index - 1,
                onTap: () {
                  FocusManager.instance.primaryFocus?.unfocus();
                  openBusiness(
                    context,
                    business.id,
                    BusinessTrafficSource.search,
                    searchQuery: attributionQuery,
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
