import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_menu_utils.dart';
import '../providers/owner_menu_provider.dart';
import '../providers/owner_providers.dart';
import 'widgets/service_menu_widgets.dart';

class OwnerMenuScreen extends ConsumerStatefulWidget {
  const OwnerMenuScreen({
    super.key,
    required this.businessId,
    required this.businessTitle,
  });

  final String businessId;
  final String businessTitle;

  @override
  ConsumerState<OwnerMenuScreen> createState() => _OwnerMenuScreenState();
}

class _OwnerMenuScreenState extends ConsumerState<OwnerMenuScreen> {
  static const _pageSize = 20;

  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  Timer? _searchDebounce;

  String? _sectionId;
  String _search = '';
  int _page = 1;
  int _requestGeneration = 0;
  final _items = <Map<String, dynamic>>[];
  Map<String, dynamic>? _pagination;
  List<Map<String, dynamic>> _sections = const [];
  bool _loadingMore = false;
  String? _loadMoreError;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void didUpdateWidget(covariant OwnerMenuScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.businessId != widget.businessId) {
      _resetCatalogState(clearSearch: true);
      ref.invalidate(ownerMenuItemsPageProvider(_query));
    }
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  OwnerMenuItemsQuery get _query => OwnerMenuItemsQuery(
        businessId: widget.businessId,
        page: _page,
        sectionId: _sectionId,
        search: _search.isEmpty ? null : _search,
        limit: _pageSize,
      );

  void _resetCatalogState({bool clearSearch = false}) {
    _requestGeneration++;
    _page = 1;
    _items.clear();
    _pagination = null;
    _sections = const [];
    _loadingMore = false;
    _loadMoreError = null;
    if (clearSearch) {
      _search = '';
      _sectionId = null;
      _searchController.clear();
    }
  }

  void _invalidateMenu() {
    _resetCatalogState();
    ref.invalidate(ownerMenuItemsPageProvider(_query));
    ref.invalidate(businessDetailsProvider(widget.businessId));
    ref.invalidate(serviceMenuProvider(widget.businessId));
    ref.invalidate(businessPlanProvider(widget.businessId));
  }

  void _onScroll() {
    if (!_scrollController.hasClients || _loadingMore) return;
    if (!ownerMenuHasMore(_pagination)) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 240) {
      unawaited(_loadMore());
    }
  }

  Future<void> _reloadFirstPage() async {
    final generation = ++_requestGeneration;
    setState(() {
      _page = 1;
      _items.clear();
      _pagination = null;
      _loadMoreError = null;
    });
    ref.invalidate(ownerMenuItemsPageProvider(_query));
    await ref.read(ownerMenuItemsPageProvider(_query).future).then((data) {
      if (!mounted || generation != _requestGeneration) return;
      _applyPageData(data, replace: true);
    }).catchError((_) {});
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !ownerMenuHasMore(_pagination)) return;
    final generation = _requestGeneration;
    final nextPage = (_pagination?['page'] as int? ?? 1) + 1;

    setState(() {
      _loadingMore = true;
      _loadMoreError = null;
      _page = nextPage;
    });

    try {
      final data = await ref.read(
        ownerMenuItemsPageProvider(
          OwnerMenuItemsQuery(
            businessId: widget.businessId,
            page: nextPage,
            sectionId: _sectionId,
            search: _search.isEmpty ? null : _search,
            limit: _pageSize,
          ),
        ).future,
      );
      if (!mounted || generation != _requestGeneration) return;
      final incoming =
          (data['items'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
      setState(() {
        final merged = mergeOwnerMenuItems(_items, incoming);
        _items
          ..clear()
          ..addAll(merged);
        _pagination = data['pagination'] as Map<String, dynamic>?;
        _sections = (data['sections'] as List<dynamic>? ?? [])
            .cast<Map<String, dynamic>>();
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted || generation != _requestGeneration) return;
      setState(() {
        _loadingMore = false;
        _loadMoreError = '$e';
        _page = (_pagination?['page'] as int? ?? 1);
      });
    }
  }

  void _applyPageData(Map<String, dynamic> data, {required bool replace}) {
    final incoming =
        (data['items'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
    setState(() {
      _items
        ..clear()
        ..addAll(replace ? incoming : mergeOwnerMenuItems(_items, incoming));
      _pagination = data['pagination'] as Map<String, dynamic>?;
      _sections = (data['sections'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      _loadingMore = false;
      _loadMoreError = null;
    });
  }

  void _scheduleSearch() {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      final next = _searchController.text.trim();
      if (next == _search) return;
      setState(() => _search = next);
      _resetCatalogState();
      ref.invalidate(ownerMenuItemsPageProvider(_query));
    });
  }

  Future<void> _showGroupDialog({Map<String, dynamic>? existing}) async {
    final titleController =
        TextEditingController(text: existing?['title'] as String? ?? '');

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(existing == null ? 'Новая группа' : 'Редактировать группу'),
        content: TextField(
          controller: titleController,
          decoration: const InputDecoration(
            labelText: 'Название группы *',
            hintText: 'Например: Горячие блюда, Стрижка',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Отмена')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Сохранить')),
        ],
      ),
    );

    if (ok != true || titleController.text.trim().isEmpty) return;

    final repo = ref.read(catalogRepositoryProvider);
    if (existing == null) {
      await repo.createServiceMenuGroup({
        'businessId': widget.businessId,
        'title': titleController.text.trim(),
      });
    } else {
      await repo.updateServiceMenuGroup(existing['id'] as String, {
        'title': titleController.text.trim(),
      });
    }
    _invalidateMenu();
  }

  List<Map<String, dynamic>> get _groupOptions => _sections
      .where((g) => g['isActive'] as bool? ?? true)
      .toList();

  Future<void> _showItemDialog({
    Map<String, dynamic>? existing,
    String? defaultGroupId,
  }) async {
    final titleController =
        TextEditingController(text: existing?['title'] as String? ?? '');
    final descController =
        TextEditingController(text: existing?['description'] as String? ?? '');
    final priceController =
        TextEditingController(text: existing?['price']?.toString() ?? '');
    String? selectedGroupId =
        itemSectionId(existing ?? {}) ?? defaultGroupId;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(existing == null ? 'Новая позиция' : 'Редактировать'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_groupOptions.isNotEmpty)
                  DropdownButtonFormField<String?>(
                    value: selectedGroupId,
                    decoration: const InputDecoration(labelText: 'Группа'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Без группы')),
                      ..._groupOptions.map(
                        (g) => DropdownMenuItem(
                          value: g['id'] as String,
                          child: Text(g['title'] as String? ?? ''),
                        ),
                      ),
                    ],
                    onChanged: (v) => setState(() => selectedGroupId = v),
                  ),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(labelText: 'Название *'),
                ),
                TextField(
                  controller: priceController,
                  decoration: const InputDecoration(labelText: 'Цена (₸)'),
                  keyboardType: TextInputType.number,
                ),
                TextField(
                  controller: descController,
                  decoration: const InputDecoration(labelText: 'Описание'),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Отмена')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Сохранить')),
          ],
        ),
      ),
    );

    if (ok != true || titleController.text.trim().isEmpty) return;

    final repo = ref.read(catalogRepositoryProvider);
    final price = double.tryParse(priceController.text.trim().replaceAll(',', '.'));
    final payload = <String, dynamic>{
      'title': titleController.text.trim(),
      if (descController.text.trim().isNotEmpty) 'description': descController.text.trim(),
      if (price != null) 'price': price,
      'groupId': selectedGroupId,
    };

    if (existing == null) {
      await repo.createServiceItem({'businessId': widget.businessId, ...payload});
    } else {
      await repo.updateServiceItem(existing['id'] as String, payload);
    }
    _invalidateMenu();
  }

  Future<void> _handleItemAction(Map<String, dynamic> item, String action) async {
    final repo = ref.read(catalogRepositoryProvider);
    final id = item['id'] as String;
    if (action == 'edit') {
      await _showItemDialog(existing: item);
    } else if (action == 'hide') {
      await repo.updateServiceItem(id, {'isActive': false});
      _invalidateMenu();
    } else if (action == 'show') {
      await repo.updateServiceItem(id, {'isActive': true});
      _invalidateMenu();
    } else if (action == 'delete') {
      await repo.deleteServiceItem(id);
      _invalidateMenu();
    }
  }

  @override
  Widget build(BuildContext context) {
    final catalogAsync = ref.watch(ownerMenuItemsPageProvider(_query));
    final planAsync = ref.watch(businessPlanProvider(widget.businessId));

    ref.listen(ownerMenuItemsPageProvider(_query), (previous, next) {
      next.whenData((data) {
        if (_page != 1 || !mounted) return;
        _applyPageData(data, replace: true);
      });
    });

    return Scaffold(
      appBar: AppBar(
        leading: qalagoBackLeading(context, fallbackLocation: '/owner'),
        title: Text('Товары и услуги · ${widget.businessTitle}'),
      ),
      body: catalogAsync.when(
        loading: () {
          if (_items.isNotEmpty) {
            return _buildBody(planAsync, showInlineLoading: true);
          }
          return const LoadingView();
        },
        error: (e, _) {
          if (_items.isNotEmpty) {
            return _buildBody(planAsync, showInlineLoading: false);
          }
          return ErrorView(
            message: '$e',
            onRetry: _reloadFirstPage,
          );
        },
        data: (data) => _buildBody(planAsync, showInlineLoading: false),
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            heroTag: 'add_group_${widget.businessId}',
            onPressed: () => _showGroupDialog(),
            icon: const Icon(Icons.create_new_folder_outlined),
            label: const Text('Группа'),
          ),
          const SizedBox(height: 12),
          FloatingActionButton.extended(
            heroTag: 'add_item_${widget.businessId}',
            onPressed: () {
              final firstGroupId =
                  _groupOptions.isNotEmpty ? _groupOptions.first['id'] as String? : null;
              _showItemDialog(defaultGroupId: firstGroupId);
            },
            icon: const Icon(Icons.add),
            label: const Text('Позиция'),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(
    AsyncValue<Map<String, dynamic>> planAsync, {
    required bool showInlineLoading,
  }) {
    final totalCount = _pagination?['total'] as int? ?? _items.length;
    final emptyMessage = ownerMenuEmptyMessage(
      totalCount: totalCount,
      search: _search,
      sectionId: _sectionId,
    );

    return RefreshIndicator(
      onRefresh: _reloadFirstPage,
      child: ListView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          planAsync.maybeWhen(
            data: (plan) {
              final limits = plan['limits'] as Map<String, dynamic>? ?? {};
              final usage = plan['usage'] as Map<String, dynamic>? ?? {};
              final maxItems = limits['maxServiceItems'] as int?;
              final used = usage['serviceItems'] as int? ?? totalCount;
              if (maxItems == null) {
                return Text(
                  '$totalCount позиций',
                  style: Theme.of(context).textTheme.titleMedium,
                );
              }
              return Text(
                '$used / $maxItems позиций',
                style: Theme.of(context).textTheme.titleMedium,
              );
            },
            orElse: () => Text(
              '$totalCount позиций',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Найти товар или услугу',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _search.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _search = '');
                        _resetCatalogState();
                        ref.invalidate(ownerMenuItemsPageProvider(_query));
                      },
                    )
                  : null,
            ),
            onChanged: (_) => _scheduleSearch(),
            onSubmitted: (_) {
              _searchDebounce?.cancel();
              setState(() => _search = _searchController.text.trim());
              _resetCatalogState();
              ref.invalidate(ownerMenuItemsPageProvider(_query));
            },
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(
                  label: 'Все',
                  selected: _sectionId == null,
                  onTap: () {
                    setState(() => _sectionId = null);
                    _resetCatalogState();
                    ref.invalidate(ownerMenuItemsPageProvider(_query));
                  },
                ),
                _FilterChip(
                  label: 'Без раздела',
                  selected: _sectionId == 'uncategorized',
                  onTap: () {
                    setState(() => _sectionId = 'uncategorized');
                    _resetCatalogState();
                    ref.invalidate(ownerMenuItemsPageProvider(_query));
                  },
                ),
                ..._sections.map(
                  (section) => _FilterChip(
                    label:
                        '${section['title']} (${section['itemCount'] ?? 0})',
                    selected: _sectionId == section['id'],
                    onTap: () {
                      setState(() => _sectionId = section['id'] as String);
                      _resetCatalogState();
                      ref.invalidate(ownerMenuItemsPageProvider(_query));
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (showInlineLoading && _items.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (emptyMessage != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Text(
                emptyMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textMuted),
              ),
            )
          else
            ..._items.map(
              (item) => _OwnerItemTile(
                item: item,
                onAction: (action) => _handleItemAction(item, action),
              ),
            ),
          if (_loadingMore)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(child: CircularProgressIndicator()),
            ),
          if (_loadMoreError != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                children: [
                  Text(
                    'Не удалось загрузить ещё',
                    style: TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                  TextButton(onPressed: _loadMore, child: const Text('Повторить')),
                ],
              ),
            )
          else if (ownerMenuHasMore(_pagination) && !_loadingMore && _items.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: OutlinedButton(
                onPressed: _loadMore,
                child: const Text('Показать ещё'),
              ),
            ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _OwnerItemTile extends StatelessWidget {
  const _OwnerItemTile({required this.item, required this.onAction});

  final Map<String, dynamic> item;
  final void Function(String action) onAction;

  @override
  Widget build(BuildContext context) {
    final price = item['price'];
    final isActive = item['isActive'] as bool? ?? true;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(
          item['title'] as String? ?? '',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            decoration: isActive ? null : TextDecoration.lineThrough,
            color: isActive ? null : AppTheme.textMuted,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              itemSectionLabel(item),
              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
            if (item['description'] != null) Text(item['description'] as String),
            if (price != null)
              Text(
                '${formatMenuPrice(price)} ₸',
                style: const TextStyle(
                  color: AppTheme.kzBlue,
                  fontWeight: FontWeight.bold,
                ),
              ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: onAction,
          itemBuilder: (_) => [
            const PopupMenuItem(value: 'edit', child: Text('Редактировать')),
            PopupMenuItem(
              value: isActive ? 'hide' : 'show',
              child: Text(isActive ? 'Скрыть' : 'Показать'),
            ),
            const PopupMenuItem(value: 'delete', child: Text('Удалить')),
          ],
        ),
      ),
    );
  }
}
