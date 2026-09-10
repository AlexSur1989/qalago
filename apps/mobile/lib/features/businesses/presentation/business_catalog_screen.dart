import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../analytics/widgets/tracked_catalog_item_card.dart';
import '../providers/business_catalog_provider.dart';

class BusinessCatalogScreen extends ConsumerStatefulWidget {
  const BusinessCatalogScreen({super.key, required this.businessId});

  final String businessId;

  @override
  ConsumerState<BusinessCatalogScreen> createState() =>
      _BusinessCatalogScreenState();
}

class _BusinessCatalogScreenState extends ConsumerState<BusinessCatalogScreen> {
  final _searchController = TextEditingController();
  String? _sectionId;
  String _search = '';
  int _page = 1;
  final _items = <Map<String, dynamic>>[];
  Map<String, dynamic>? _pagination;
  List<Map<String, dynamic>> _sections = const [];
  bool _loadingMore = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  BusinessCatalogQuery get _query => BusinessCatalogQuery(
        businessId: widget.businessId,
        page: _page,
        sectionId: _sectionId,
        search: _search.isEmpty ? null : _search,
      );

  Future<void> _reload() async {
    setState(() {
      _page = 1;
      _items.clear();
      _pagination = null;
    });
    ref.invalidate(businessCatalogPageProvider(_query));
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _pagination == null) return;
    final totalPages = _pagination!['totalPages'] as int? ?? 0;
    final currentPage = _pagination!['page'] as int? ?? 1;
    if (currentPage >= totalPages) return;

    setState(() {
      _loadingMore = true;
      _page = currentPage + 1;
    });

    try {
      final data = await ref.read(businessCatalogPageProvider(_query).future);
      if (!mounted) return;
      setState(() {
        _items.addAll(
          (data['items'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>(),
        );
        _pagination = data['pagination'] as Map<String, dynamic>?;
        _loadingMore = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _loadingMore = false);
      }
    }
  }

  void _applySearch() {
    setState(() => _search = _searchController.text.trim());
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    final catalogAsync = ref.watch(businessCatalogPageProvider(_query));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Товары и услуги'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: catalogAsync.when(
        loading: () {
          if (_items.isNotEmpty) {
            return _CatalogBody(
              businessId: widget.businessId,
              searchController: _searchController,
              sections: _sections,
              sectionId: _sectionId,
              items: _items,
              pagination: _pagination,
              loadingMore: _loadingMore,
              onSearch: _applySearch,
              onSectionSelected: (id) {
                setState(() => _sectionId = id);
                _reload();
              },
              onLoadMore: _loadMore,
            );
          }
          return const LoadingView();
        },
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: _reload,
        ),
        data: (data) {
          if (_page == 1 && _items.isEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              setState(() {
                _items
                  ..clear()
                  ..addAll(
                    (data['items'] as List<dynamic>? ?? [])
                        .cast<Map<String, dynamic>>(),
                  );
                _pagination = data['pagination'] as Map<String, dynamic>?;
                _sections = (data['sections'] as List<dynamic>? ?? [])
                    .cast<Map<String, dynamic>>();
              });
            });
          }

          return _CatalogBody(
            businessId: widget.businessId,
            searchController: _searchController,
            sections: _sections,
            sectionId: _sectionId,
            items: _items.isEmpty
                ? (data['items'] as List<dynamic>? ?? [])
                    .cast<Map<String, dynamic>>()
                : _items,
            pagination: _pagination ?? data['pagination'] as Map<String, dynamic>?,
            loadingMore: _loadingMore,
            onSearch: _applySearch,
            onSectionSelected: (id) {
              setState(() => _sectionId = id);
              _reload();
            },
            onLoadMore: _loadMore,
          );
        },
      ),
    );
  }
}

class _CatalogBody extends StatelessWidget {
  const _CatalogBody({
    required this.businessId,
    required this.searchController,
    required this.sections,
    required this.sectionId,
    required this.items,
    required this.pagination,
    required this.loadingMore,
    required this.onSearch,
    required this.onSectionSelected,
    required this.onLoadMore,
  });

  final String businessId;

  final TextEditingController searchController;
  final List<Map<String, dynamic>> sections;
  final String? sectionId;
  final List<Map<String, dynamic>> items;
  final Map<String, dynamic>? pagination;
  final bool loadingMore;
  final VoidCallback onSearch;
  final ValueChanged<String?> onSectionSelected;
  final VoidCallback onLoadMore;

  @override
  Widget build(BuildContext context) {
    final total = pagination?['total'] as int? ?? items.length;
    final page = pagination?['page'] as int? ?? 1;
    final totalPages = pagination?['totalPages'] as int? ?? 0;
    final canLoadMore = page < totalPages;

    return RefreshIndicator(
      color: Theme.of(context).colorScheme.primary,
      onRefresh: () async => onSearch(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        children: [
          TextField(
            controller: searchController,
            decoration: InputDecoration(
              hintText: 'Найти товар или услугу',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.arrow_forward),
                onPressed: onSearch,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onSubmitted: (_) => onSearch(),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _SectionChip(
                  label: 'Все',
                  selected: sectionId == null,
                  onTap: () => onSectionSelected(null),
                ),
                for (final section in sections) ...[
                  const SizedBox(width: 8),
                  _SectionChip(
                    label: section['title'] as String? ?? '',
                    selected: sectionId == section['id'],
                    onTap: () => onSectionSelected(section['id'] as String?),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (items.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 48),
              child: Center(
                child: Text(
                  'Ничего не найдено',
                  style: TextStyle(color: Color(0xFF687080)),
                ),
              ),
            )
          else ...[
            Text(
              'Найдено: $total',
              style: const TextStyle(color: Color(0xFF687080), fontSize: 13),
            ),
            const SizedBox(height: 8),
            for (final item in items)
              TrackedCatalogItemCard(
                businessId: businessId,
                item: item,
                surface: 'CATALOG_SCREEN',
              ),
            if (canLoadMore)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: OutlinedButton(
                  onPressed: loadingMore ? null : onLoadMore,
                  child: loadingMore
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Показать ещё'),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _SectionChip extends StatelessWidget {
  const _SectionChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: AppTheme.kzBlue.withValues(alpha: 0.12),
      checkmarkColor: AppTheme.kzBlue,
    );
  }
}
