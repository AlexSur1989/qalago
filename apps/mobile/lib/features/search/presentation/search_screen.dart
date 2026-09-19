import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/location/user_location_provider.dart';
import '../../../core/locale/app_locale_provider.dart';
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
import '../../catalog/data/catalog_repository.dart';
import '../../categories/utils/category_display.dart';
import '../../home/presentation/home_layout.dart';
import '../search_active_filters.dart';
import '../search_catalog_sort.dart';
import '../search_catalog_suggestions.dart';
import '../search_filters.dart';
import '../catalog_explicit_user_location.dart';
import '../search_catalog_geo_params.dart';
import '../search_geo_policy.dart';
import '../search_pagination.dart';
import '../search_query_normalize.dart';
import '../search_query_policy.dart';
import '../search_recent_history_provider.dart';
import '../search_result_count.dart';
import '../search_taxonomy_provider.dart';
import 'search_controls_bar.dart';
import 'search_filter_sections.dart';
import 'search_filters_sheet.dart';
import 'search_history_suggestions_pane.dart';
import 'search_scope_chip.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({
    super.key,
    this.initialQuery,
    this.categoryId,
    this.subcategoryId,
    this.initialRadiusKm,
    this.initialSort,
  });

  final String? initialQuery;
  final String? categoryId;
  final String? subcategoryId;
  final String? initialRadiusKm;
  final String? initialSort;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _controller;
  late final FocusNode _focusNode;
  String _query = '';
  String? _resultAttributionQuery;
  String? _categoryId;
  String? _subcategoryId;
  SearchRadiusMode _radiusMode = SearchRadiusMode.wholeCity;
  SearchCatalogSort _sort = SearchCatalogSort.recommended;
  Timer? _debounce;
  bool _syncingRoute = false;
  String? _lastSearchPerformedQuery;
  int _fetchGeneration = 0;
  int? _verifiedResultsGeneration;
  List<BusinessModel> _loadedItems = const [];
  int _resultTotal = 0;
  int _loadedPage = 0;
  bool _loadingMore = false;
  Object? _loadMoreError;
  CancelToken? _loadMoreCancelToken;
  int _loadMoreGeneration = 0;
  final ScrollController _resultsScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery?.trim() ?? '';
    _categoryId = widget.categoryId;
    _subcategoryId = widget.subcategoryId;
    _radiusMode = SearchRadiusModeX.fromRadiusKmParam(widget.initialRadiusKm);
    _sort = SearchCatalogSort.fromApi(widget.initialSort);
    _controller = TextEditingController(text: _query);
    _focusNode = FocusNode();
    _focusNode.addListener(_onSearchFieldFocusChanged);
    _resultsScrollController.addListener(_onResultsScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_bootstrapGeoFromRoute());
    });
  }

  Future<void> _bootstrapGeoFromRoute() async {
    if (!mounted) return;
    if (_radiusMode != SearchRadiusMode.wholeCity) {
      await _applyFilters(
        categoryId: _categoryId,
        subcategoryId: _subcategoryId,
        radiusMode: _radiusMode,
      );
      return;
    }
    if (_sort == SearchCatalogSort.nearest) {
      await _setSort(SearchCatalogSort.nearest);
    }
  }

  void _onSearchFieldFocusChanged() {
    if (mounted) setState(() {});
  }

  @override
  void didUpdateWidget(covariant SearchScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_syncingRoute) return;

    final nextQuery = widget.initialQuery?.trim() ?? '';
    final nextCategory = widget.categoryId;
    final nextRadius = SearchRadiusModeX.fromRadiusKmParam(widget.initialRadiusKm);

    final nextSubcategory = widget.subcategoryId;
    final nextSort = SearchCatalogSort.fromApi(widget.initialSort);

    if (nextQuery == _query &&
        nextCategory == _categoryId &&
        nextSubcategory == _subcategoryId &&
        nextRadius == _radiusMode &&
        nextSort == _sort) {
      return;
    }

    _debounce?.cancel();
    _invalidateSearchResults(
      applyState: () {
        _query = nextQuery;
        _categoryId = nextCategory;
        _subcategoryId = nextSubcategory;
        _radiusMode = nextRadius;
        _sort = nextSort;
      },
    );
    if (_controller.text != nextQuery) {
      _controller.text = nextQuery;
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _loadMoreCancelToken?.cancel();
    _resultsScrollController.removeListener(_onResultsScroll);
    _resultsScrollController.dispose();
    _focusNode.removeListener(_onSearchFieldFocusChanged);
    _focusNode.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _invalidateSearchResults({VoidCallback? applyState}) {
    _loadMoreCancelToken?.cancel();
    _loadMoreCancelToken = null;
    setState(() {
      applyState?.call();
      _fetchGeneration++;
      _loadMoreGeneration++;
      _verifiedResultsGeneration = null;
      _loadedItems = const [];
      _resultTotal = 0;
      _loadedPage = 0;
      _loadingMore = false;
      _loadMoreError = null;
    });
  }

  void _onResultsScroll() {
    if (!_resultsScrollController.hasClients) return;
    if (_loadingMore || _loadMoreError != null) return;
    if (!searchHasMoreResults(
      loadedCount: _loadedItems.length,
      total: _resultTotal,
    )) {
      return;
    }
    final position = _resultsScrollController.position;
    if (position.maxScrollExtent <= 0 || position.pixels <= 0) return;
    if (position.pixels >= position.maxScrollExtent - 280) {
      unawaited(_loadMoreResults());
    }
  }

  SearchResultsPaneMode get _paneMode => resolveSearchResultsPaneMode(
        trimmedQuery: _query,
        categoryId: _categoryId,
        radiusMode: _radiusMode,
      );

  bool get _hasNarrowFilters =>
      _query.isNotEmpty ||
      _categoryId != null ||
      _subcategoryId != null ||
      _radiusMode != SearchRadiusMode.wholeCity ||
      searchHasNonDefaultSort(_sort);

  ({double? lat, double? lng, double? radiusKm}) _geoParams() {
    final geo = buildSearchCatalogGeoParams(
      ref: ref,
      radiusMode: _radiusMode,
      sort: _sort,
    );
    return (lat: geo.lat, lng: geo.lng, radiusKm: geo.radiusKm);
  }

  String? _effectiveSortApiValue() {
    return buildSearchCatalogGeoParams(
      ref: ref,
      radiusMode: _radiusMode,
      sort: _sort,
    ).sort;
  }

  BusinessesQuery _buildQuery() {
    final suppressNetwork = !searchShouldFetchBusinesses(
      trimmedQuery: _query,
      categoryId: _categoryId,
      radiusMode: _radiusMode,
    );
    final search = searchApiTextParam(
      trimmedQuery: _query,
      categoryId: _categoryId,
    );
    final geo = _geoParams();
    return BusinessesQuery(
      search: search,
      categoryId: _categoryId,
      subcategoryId: _subcategoryId,
      latitude: geo.lat,
      longitude: geo.lng,
      radiusKm: geo.radiusKm,
      sort: _effectiveSortApiValue(),
      limit: kSearchResultsPageSize,
      suppressNetwork: suppressNetwork,
    );
  }

  Future<void> _loadMoreResults() async {
    if (_loadingMore || _loadMoreError != null) return;
    if (!searchHasMoreResults(
      loadedCount: _loadedItems.length,
      total: _resultTotal,
    )) {
      return;
    }
    final generation = _fetchGeneration;
    final loadMoreGeneration = _loadMoreGeneration;
    final nextPage = _loadedPage + 1;
    final query = _buildQuery();
    if (query.suppressNetwork) return;

    _loadMoreCancelToken?.cancel();
    final cancelToken = CancelToken();
    _loadMoreCancelToken = cancelToken;

    setState(() {
      _loadingMore = true;
      _loadMoreError = null;
    });

    try {
      final city = ref.read(cityProvider);
      final page = await ref.read(catalogRepositoryProvider).fetchBusinesses(
            citySlug: city.slug,
            search: query.search,
            categoryId: query.categoryId,
            subcategoryId: query.subcategoryId,
            latitude: query.latitude,
            longitude: query.longitude,
            radiusKm: query.radiusKm,
            sort: query.sort,
            page: nextPage,
            limit: kSearchResultsPageSize,
            cancelToken: cancelToken,
          );
      if (!mounted ||
          generation != _fetchGeneration ||
          loadMoreGeneration != _loadMoreGeneration) {
        return;
      }
      setState(() {
        _loadedItems = mergeSearchResultPages(_loadedItems, page.items);
        _resultTotal = page.total;
        _loadedPage = nextPage;
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted ||
          generation != _fetchGeneration ||
          loadMoreGeneration != _loadMoreGeneration) {
        return;
      }
      if (e is DioException && CancelToken.isCancel(e)) return;
      setState(() {
        _loadingMore = false;
        _loadMoreError = e;
      });
    }
  }

  void _syncRoute() {
    if (_syncingRoute || !mounted) return;
    _syncingRoute = true;
    final params = buildSearchRouteParams(
      query: _query,
      categoryId: _categoryId,
      subcategoryId: _subcategoryId,
      radiusMode: _radiusMode,
      sortApiValue: _sort.apiValue,
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
      _invalidateSearchResults(applyState: () => _query = next);
      _syncRoute();
    });
    if (mounted) setState(() {});
  }

  void _recordRecentSearchIfEligible(String rawQuery) {
    final normalized = normalizeConsumerSearchQuery(rawQuery);
    if (normalized == null) return;
    if (!shouldPersistConsumerSearchHistory(
      trimmedQuery: normalized,
      categoryId: _categoryId,
    )) {
      return;
    }
    unawaited(ref.read(searchRecentHistoryProvider.notifier).push(normalized));
  }

  void _applyCommittedQuery(String rawQuery, {bool unfocus = true}) {
    _debounce?.cancel();
    final next = normalizeConsumerSearchQuery(rawQuery) ?? '';
    if (_controller.text != next) {
      _controller.text = next;
    }
    if (next != _query) {
      _invalidateSearchResults(applyState: () => _query = next);
      _syncRoute();
    }
    _recordRecentSearchIfEligible(next);
    if (unfocus) {
      FocusManager.instance.primaryFocus?.unfocus();
    }
  }

  void _clearQuery() {
    _debounce?.cancel();
    _controller.clear();
    if (_query.isEmpty) {
      _focusNode.requestFocus();
      return;
    }
    _invalidateSearchResults(applyState: () => _query = '');
    _syncRoute();
    _focusNode.requestFocus();
  }

  void _clearCategoryScope() {
    if (_categoryId == null && _subcategoryId == null) return;
    _invalidateSearchResults(
      applyState: () {
        _categoryId = null;
        _subcategoryId = null;
      },
    );
    _syncRoute();
  }

  void _resetSearchFiltersOnly() {
    clearCatalogExplicitUserGps(ref);
    _invalidateSearchResults(
      applyState: () {
        _categoryId = null;
        _subcategoryId = null;
        _radiusMode = SearchRadiusMode.wholeCity;
        _sort = SearchCatalogSort.recommended;
      },
    );
    _syncRoute();
  }

  void _resetFilters() => _resetSearchFiltersOnly();

  Future<void> _applyFilters({
    String? categoryId,
    String? subcategoryId,
    required SearchRadiusMode radiusMode,
  }) async {
    if (radiusMode == SearchRadiusMode.wholeCity) {
      clearCatalogExplicitUserGps(ref);
      _commitFilters(
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        radiusMode: radiusMode,
        sort: _sort,
      );
      return;
    }

    final location = await resolveCatalogUserLocation(ref);
    if (!mounted) return;
    if (!location.isSuccess) {
      await showCatalogLocationOutcomeFeedback(context, location);
      _commitFilters(
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        radiusMode: SearchRadiusMode.wholeCity,
        sort: _sort == SearchCatalogSort.nearest
            ? SearchCatalogSort.recommended
            : _sort,
      );
      return;
    }

    _commitFilters(
      categoryId: categoryId,
      subcategoryId: subcategoryId,
      radiusMode: radiusMode,
      sort: _sort,
    );
  }

  void _commitFilters({
    required String? categoryId,
    required String? subcategoryId,
    required SearchRadiusMode radiusMode,
    required SearchCatalogSort sort,
  }) {
    _invalidateSearchResults(
      applyState: () {
        _categoryId = categoryId;
        _subcategoryId = subcategoryId;
        _radiusMode = radiusMode;
        _sort = sort;
      },
    );
    _syncRoute();
  }

  Future<void> _setSort(SearchCatalogSort sort) async {
    if (sort == _sort) return;
    if (sort != SearchCatalogSort.nearest) {
      _invalidateSearchResults(applyState: () => _sort = sort);
      _syncRoute();
      return;
    }

    final location = await resolveCatalogUserLocation(ref);
    if (!mounted) return;
    if (!location.isSuccess) {
      await showCatalogLocationOutcomeFeedback(context, location);
      return;
    }

    _invalidateSearchResults(applyState: () => _sort = SearchCatalogSort.nearest);
    _syncRoute();
  }

  void _trackSearchPerformedIfNeeded(String? searchQuery, int generation) {
    if (generation != _fetchGeneration) return;
    final normalized = searchQuery?.trim();
    if (normalized == null || normalized.isEmpty) return;
    if (_lastSearchPerformedQuery == normalized) return;
    _lastSearchPerformedQuery = normalized;
    _recordRecentSearchIfEligible(normalized);

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

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final localeCode = resolveLocaleCode(ref.watch(appLocaleCodeProvider));
    final query = _buildQuery();
    final fetchGen = _fetchGeneration;
    final businessesAsync = ref.watch(businessesProvider(query));
    final categoriesAsync = ref.watch(categoriesProvider);
    final recentHistoryAsync = ref.watch(searchRecentHistoryProvider);
    final subcategoriesAsync = ref.watch(searchTaxonomySubcategoriesProvider);
    final recentQueries = recentHistoryAsync.valueOrNull ?? const <String>[];
    final showRecentHistory =
        _query.isEmpty && _paneMode == SearchResultsPaneMode.initial && recentQueries.isNotEmpty;
    final categories = categoriesAsync.valueOrNull ?? const <CategoryModel>[];
    final subcategories = subcategoriesAsync.valueOrNull ?? const <SubcategoryModel>[];
    final catalogSuggestions = _focusNode.hasFocus && _query.isNotEmpty
        ? buildSearchCatalogSuggestions(
            rawQuery: _query,
            categories: categories,
            subcategories: subcategories,
            localeCode: localeCode,
          )
        : const <SearchCatalogSuggestion>[];
    final showSuggestionList = catalogSuggestions.isNotEmpty && _focusNode.hasFocus;

    ref.listen(businessesProvider(query), (previous, next) {
      next.whenData((data) {
        if (!mounted || fetchGen != _fetchGeneration) return;
        if (query.suppressNetwork) return;
        setState(() {
          _resultAttributionQuery = query.search;
          _verifiedResultsGeneration = fetchGen;
          _loadedItems = data.items;
          _resultTotal = data.total;
          _loadedPage = 1;
          _loadingMore = false;
          _loadMoreError = null;
        });
        _trackSearchPerformedIfNeeded(query.search, fetchGen);
      });
    });

    final activeFilterCount = searchActiveFilterCount(
      categoryId: _categoryId,
      subcategoryId: _subcategoryId,
      radiusMode: _radiusMode,
    );
    final nearbySortEnabled = true;

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
                      onSubmitted: (value) => _applyCommittedQuery(value),
                      onClear: _clearQuery,
                      clearSemanticsLabel: l10n.searchClearTooltip,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: HomeLayout.horizontalPadding,
              ),
              child: categoriesAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
                data: (categories) {
                  final scopeLabel = _categoryId != null
                      ? _categoryScopeLabel(categories, localeCode, l10n)
                      : null;
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SearchControlsBar(
                        l10n: l10n,
                        activeFilterCount: activeFilterCount,
                        selectedSort: _sort,
                        nearbySortEnabled: nearbySortEnabled,
                        onOpenFilters: () {
                          showSearchFiltersSheet(
                            context: context,
                            ref: ref,
                            categories: categories,
                            localeCode: localeCode,
                            categoryId: _categoryId,
                            subcategoryId: _subcategoryId,
                            radiusMode: _radiusMode,
                            onApply: (categoryId, subcategoryId, radiusMode) {
                              unawaited(
                                _applyFilters(
                                  categoryId: categoryId,
                                  subcategoryId: subcategoryId,
                                  radiusMode: radiusMode,
                                ),
                              );
                            },
                            onResetFilters: _resetSearchFiltersOnly,
                          );
                        },
                        onSortSelected: (sort) => unawaited(_setSort(sort)),
                      ),
                      if (scopeLabel != null) ...[
                        const SizedBox(height: QalaGoSpacing.space8),
                        SearchScopeChip(
                          label: scopeLabel,
                          l10n: l10n,
                          onClear: _clearCategoryScope,
                        ),
                      ],
                      if (_hasNarrowFilters) ...[
                        const SizedBox(height: QalaGoSpacing.space4),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton(
                            onPressed: _resetSearchFiltersOnly,
                            child: Text(l10n.searchResetFiltersOnly),
                          ),
                        ),
                      ],
                      const SizedBox(height: QalaGoSpacing.space8),
                    ],
                  );
                },
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: HomeLayout.horizontalPadding,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (showSuggestionList)
                      SearchCatalogSuggestionsList(
                        suggestions: catalogSuggestions,
                        l10n: l10n,
                        onSelect: (suggestion) =>
                            _applyCommittedQuery(suggestion.commitText),
                      ),
                    Expanded(
                      child: showRecentHistory
                          ? SingleChildScrollView(
                              keyboardDismissBehavior:
                                  ScrollViewKeyboardDismissBehavior.onDrag,
                              child: SearchRecentHistorySection(
                                queries: recentQueries,
                                l10n: l10n,
                                onSelect: _applyCommittedQuery,
                                onClear: () => ref
                                    .read(searchRecentHistoryProvider.notifier)
                                    .clear(),
                              ),
                            )
                          : _SearchResultsPane(
                              businessesAsync: businessesAsync,
                              paneMode: _paneMode,
                              fetchGeneration: fetchGen,
                              verifiedResultsGeneration: _verifiedResultsGeneration,
                              hasNarrowFilters: _hasNarrowFilters,
                              query: query,
                              trimmedQuery: _query,
                              loadedItems: _loadedItems,
                              resultTotal: _resultTotal,
                              loadingMore: _loadingMore,
                              loadMoreError: _loadMoreError,
                              scrollController: _resultsScrollController,
                              resultAttributionQuery: _resultAttributionQuery,
                              emptyMessage: _emptyMessage(
                                l10n,
                                ref.watch(cityLocalizedNameProvider),
                              ),
                              onRetry: () => ref.invalidate(businessesProvider(query)),
                              onResetFilters: _resetSearchFiltersOnly,
                              onLoadMore: _loadMoreResults,
                              onRetryLoadMore: _loadMoreResults,
                              onClearCategoryScope:
                                  _categoryId != null ? _clearCategoryScope : null,
                              l10n: l10n,
                            ),
                    ),
                  ],
                ),
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
    required this.paneMode,
    required this.fetchGeneration,
    required this.verifiedResultsGeneration,
    required this.hasNarrowFilters,
    required this.query,
    required this.trimmedQuery,
    required this.loadedItems,
    required this.resultTotal,
    required this.loadingMore,
    required this.loadMoreError,
    required this.scrollController,
    required this.resultAttributionQuery,
    required this.emptyMessage,
    required this.onRetry,
    required this.onResetFilters,
    required this.onLoadMore,
    required this.onRetryLoadMore,
    required this.onClearCategoryScope,
    required this.l10n,
  });

  final AsyncValue<PaginatedBusinesses> businessesAsync;
  final SearchResultsPaneMode paneMode;
  final int fetchGeneration;
  final int? verifiedResultsGeneration;
  final bool hasNarrowFilters;
  final BusinessesQuery query;
  final String trimmedQuery;
  final List<BusinessModel> loadedItems;
  final int resultTotal;
  final bool loadingMore;
  final Object? loadMoreError;
  final ScrollController scrollController;
  final String? resultAttributionQuery;
  final String emptyMessage;
  final VoidCallback onRetry;
  final VoidCallback onResetFilters;
  final VoidCallback onLoadMore;
  final VoidCallback onRetryLoadMore;
  final VoidCallback? onClearCategoryScope;
  final AppLocalizations l10n;

  bool get _resultsVerified =>
      verifiedResultsGeneration != null &&
      verifiedResultsGeneration == fetchGeneration;

  @override
  Widget build(BuildContext context) {
    switch (paneMode) {
      case SearchResultsPaneMode.initial:
        return _SearchNeutralPane(
          title: l10n.searchInitialTitle,
          body: l10n.searchInitialBody,
        );
      case SearchResultsPaneMode.continueTyping:
        return _SearchNeutralPane(
          title: l10n.searchContinueTyping,
          body: l10n.searchInitialBody,
        );
      case SearchResultsPaneMode.active:
        break;
    }

    if (businessesAsync.hasError && !_resultsVerified) {
      return ErrorView(
        message: l10n.searchResultsLoadFailed,
        onRetry: onRetry,
      );
    }

    if (!_resultsVerified &&
        (businessesAsync.isLoading || !businessesAsync.hasValue)) {
      return Semantics(
        label: l10n.searchUpdatingResults,
        child: const LoadingView(),
      );
    }

    if (!_resultsVerified) {
      return Semantics(
        label: l10n.searchUpdatingResults,
        child: const LoadingView(),
      );
    }

    final isUpdating = businessesAsync.isLoading;

    if (loadedItems.isEmpty && !isUpdating && !loadingMore) {
      return SingleChildScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: const EdgeInsets.all(HomeLayout.horizontalPadding),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
              Text(
                trimmedQuery.isNotEmpty
                    ? l10n.searchNoResults
                    : emptyMessage,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppTheme.textDark,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              if (trimmedQuery.isNotEmpty) ...[
                const SizedBox(height: QalaGoSpacing.space8),
                Text(
                  emptyMessage,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppTheme.textMuted),
                ),
              ],
              const SizedBox(height: QalaGoSpacing.space12),
              _SearchEmptyHints(l10n: l10n),
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
      );
    }

    final attributionQuery = resultAttributionQuery ?? query.search;
    final countLabel = formatSearchResultCountShown(
      l10n,
      shown: loadedItems.length,
      total: resultTotal,
    );
    final hasMore = searchHasMoreResults(
      loadedCount: loadedItems.length,
      total: resultTotal,
    );
    final footerSlots = (hasMore || loadingMore || loadMoreError != null) ? 1 : 0;
    final endReached = loadedItems.isNotEmpty && !hasMore && loadMoreError == null;

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
            controller: scrollController,
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: const EdgeInsets.fromLTRB(
              HomeLayout.horizontalPadding,
              QalaGoSpacing.space8,
              HomeLayout.horizontalPadding,
              HomeLayout.bottomPadding,
            ),
            itemCount: loadedItems.length + 1 + footerSlots + (endReached ? 1 : 0),
            separatorBuilder: (_, _) => const SizedBox(height: 12),
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
              final businessIndex = index - 1;
              if (businessIndex < loadedItems.length) {
                final business = loadedItems[businessIndex];
                return TrackedBusinessCard(
                  business: business,
                  trafficSource: BusinessTrafficSource.search,
                  searchQuery: attributionQuery,
                  position: businessIndex,
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
              }
              final footerIndex = businessIndex - loadedItems.length;
              if (footerIndex == 0 && footerSlots == 1) {
                if (loadMoreError != null) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        l10n.searchLoadMoreFailed,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: QalaGoSpacing.space8),
                      OutlinedButton(
                        onPressed: onRetryLoadMore,
                        child: Text(l10n.searchLoadMoreRetry),
                      ),
                    ],
                  );
                }
                if (loadingMore) {
                  return Semantics(
                    label: l10n.searchLoadingMore,
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  );
                }
                return OutlinedButton(
                  key: const Key('search_load_more'),
                  onPressed: onLoadMore,
                  child: Text(l10n.searchLoadMore),
                );
              }
              return Text(
                l10n.searchEndOfResults,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textMuted),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _SearchNeutralPane extends StatelessWidget {
  const _SearchNeutralPane({
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(HomeLayout.horizontalPadding),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: QalaGoSpacing.space8),
          Text(
            body,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }
}

class _SearchEmptyHints extends StatelessWidget {
  const _SearchEmptyHints({required this.l10n});

  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final hints = [
      l10n.searchEmptyHintSpelling,
      l10n.searchEmptyHintGeneral,
      l10n.searchEmptyHintFilters,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: hints
          .map(
            (hint) => Padding(
              padding: const EdgeInsets.only(bottom: QalaGoSpacing.space4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '• ',
                    style: TextStyle(color: AppTheme.textMuted),
                  ),
                  Expanded(
                    child: Text(
                      hint,
                      style: const TextStyle(color: AppTheme.textMuted),
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}
